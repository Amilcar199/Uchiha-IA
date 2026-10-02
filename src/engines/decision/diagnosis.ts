import type { Marking } from "@/domain/rules/types";

export type ReadingLevel = "observado" | "interpretado" | "nao_confirmado";

export interface DiagnosisItem {
  level: ReadingLevel;
  text: string;
}

export interface DiagnosisSection {
  title: string;
  items: DiagnosisItem[];
}

const LEVEL_LABEL: Record<ReadingLevel, string> = {
  observado: "Observado",
  interpretado: "Interpretado",
  nao_confirmado: "Não confirmado",
};

export function readingLevelLabel(level: ReadingLevel): string {
  return LEVEL_LABEL[level];
}

/**
 * Diagnóstico do print a partir do que o motor já leu.
 * Não cria regra nem percentual que os livros não tenham escrito.
 */
export function buildDiagnosis(input: {
  asset: string;
  timeframe: string;
  regime: string;
  cycle: string | null;
  trend: string;
  state: string;
  newsStatus: string;
  timingConfirmed: boolean;
  markings: Marking[];
  confluences: { family: string; evidence: string }[];
  conflicts: string[];
  missing: string[];
  candleCount: number;
  imageAccepted: boolean;
}): DiagnosisSection[] {
  const lots = input.markings.filter((item) => item.type === "LOT");
  const connections = input.markings.filter((item) => item.type === "LOT_CONNECTION");
  const classics = input.markings.filter((item) => item.type === "CLASSIC");
  const magic = input.markings.filter((item) => item.type === "MAGIC_CANDLE");
  const named = input.markings.filter((item) =>
    ["COMMAND", "SINGLE_RATE", "MAGIC_CANDLE", "DIVIDED_RATE", "NEW_POSITION", "FIRST_RECORD", "CLOSED_PRICE"].includes(
      item.type,
    ),
  );

  return [
    {
      title: "Resumo do gráfico",
      items: [
        {
          level: "interpretado",
          text: `${input.asset} em ${input.timeframe}, regime ${input.regime}. Tendência ${input.trend.toLowerCase()}${
            input.cycle ? `, ciclo ${input.cycle.replaceAll("_", " ").toLowerCase()}` : ", ciclo ainda não classificado"
          }.`,
        },
        {
          level: "interpretado",
          text: "A leitura explica a estrutura. Não é uma ordem de compra ou venda.",
        },
      ],
    },
    {
      title: "Informações detectadas",
      items: [
        {
          level: "nao_confirmado",
          text: "O par e o timeframe vieram do formulário. O print não foi lido por reconhecimento de texto.",
        },
        {
          level: input.candleCount > 0 ? "observado" : "nao_confirmado",
          text:
            input.candleCount > 0
              ? `Foram separadas ${input.candleCount} velas pela cor do corpo e dos pavios.`
              : "Não foi possível confirmar velas neste print.",
        },
      ],
    },
    {
      title: "Qualidade do print",
      items: [
        {
          level: input.imageAccepted ? "observado" : "nao_confirmado",
          text: input.imageAccepted
            ? "A imagem tem tamanho suficiente para uma leitura."
            : "Não foi possível confirmar esta condição pela imagem.",
        },
      ],
    },
    {
      title: "Estrutura e tendência",
      items: [
        {
          level: input.cycle ? "interpretado" : "nao_confirmado",
          text: input.cycle
            ? `A sucessão de topos e fundos sustenta tendência ${input.trend.toLowerCase()}.`
            : "Regra identificada na teoria, mas não confirmável neste print: faltam topos e fundos comparáveis.",
        },
      ],
    },
    {
      title: "Movimento atual",
      items: [
        {
          level: "interpretado",
          text: movementText(input.trend, input.cycle),
        },
      ],
    },
    {
      title: "Velas importantes",
      items: named.length
        ? named.slice(-8).map((item) => ({
            level: "observado" as const,
            text: `${label(item.type)} na vela ${item.candleIndex ?? "—"}${item.direction ? `, lado ${item.direction === "BUY" ? "compra" : "venda"}` : ""}.`,
          }))
        : [{ level: "nao_confirmado", text: "Nenhuma vela de comando, taxa, mágica ou registro foi confirmada." }],
    },
    {
      title: "Lotes",
      items: [
        {
          level: lots.length ? "observado" : "nao_confirmado",
          text: lots.length
            ? `${lots.length} lote(s): ${count(lots, "nano")} nano, ${count(lots, "micro")} micro. O macro é o conjunto deles, sem um número extra na fonte.`
            : "Não foi possível confirmar lotes neste print.",
        },
      ],
    },
    {
      title: "Conexões",
      items: [
        {
          level: connections.length ? "interpretado" : "nao_confirmado",
          text: connections.length
            ? `${connections.length} conexão(ões) fecharam dentro do corpo, com as cinco regras do Guia.`
            : "Nenhuma conexão de lotes ficou completa. Se uma das cinco regras falha, não há leitura.",
        },
      ],
    },
    {
      title: "Zonas e 50%",
      items: magic.length
        ? [
            {
              level: "observado" as const,
              text: "O candle mágico marca a abertura e o fechamento. O meio dessa região é a zona de 50% escrita no Guia.",
            },
            {
              level: "nao_confirmado" as const,
              text: "A entrada nessa zona só vale depois do rompimento confirmado com pavio. Isso não ficou confirmado só pela imagem.",
            },
          ]
        : [
            {
              level: "nao_confirmado",
              text: "Não há candle mágico para marcar 50%. Linhas de grelha ou médias que não aparecem no print não são inventadas.",
            },
          ],
    },
    {
      title: "Padrões",
      items: classics.length
        ? classics.slice(-6).map((item) => ({
            level: "interpretado" as const,
            text: `${String(item.metadata.name ?? "Padrão clássico")} na vela ${item.candleIndex ?? "—"}. Sozinho não autoriza entrada.`,
          }))
        : [{ level: "nao_confirmado", text: "Nenhum padrão clássico do material ficou confirmado." }],
    },
    {
      title: "Confluências",
      items: input.confluences.length
        ? input.confluences.map((item) => ({ level: "interpretado" as const, text: `${item.family}: ${item.evidence}` }))
        : [{ level: "nao_confirmado", text: "Ainda não há três confluências independentes." }],
    },
    {
      title: "Condições não confirmadas",
      items: unconfirmed(input),
    },
    {
      title: "Estado final",
      items: [
        {
          level: "interpretado",
          text: stateText(input.state),
        },
        ...input.conflicts.map((item) => ({
          level: "nao_confirmado" as const,
          text: `Conflito registado, sem uma terceira regra para o resolver: ${item}.`,
        })),
      ],
    },
  ];
}

function movementText(trend: string, cycle: string | null): string {
  if (!cycle) return "A sequência do movimento não fecha um ciclo. Condição parcialmente observada.";
  if (cycle === "CORRECAO_EM_TENDENCIA") {
    return `Há impulso e correção dentro da tendência de ${trend.toLowerCase()}. O material trata este como o ciclo em que os conceitos podem aparecer juntos.`;
  }
  if (cycle === "CORRECAO_LATERAL") return "O movimento está lateral. O material só admite retração e reversão neste ciclo.";
  if (cycle === "TENDENCIA") return "O movimento está tendencial. O material só admite rompimento e continuação até à próxima defesa.";
  return "O ciclo consolidado aparece no Guia, mas o mesmo material também manda cuidado com gráficos sem topos e fundos claros.";
}

function unconfirmed(input: {
  timingConfirmed: boolean;
  newsStatus: string;
  missing: string[];
}): DiagnosisItem[] {
  const items: DiagnosisItem[] = [
    {
      level: "nao_confirmado",
      text: "Espaço até a próxima defesa e pavio longo não têm número nos livros. A condição fica visual e não confirmada.",
    },
  ];
  if (!input.timingConfirmed) {
    items.push({
      level: "nao_confirmado",
      text: "A regra dos 15 segundos não foi confirmada. O print, sozinho, não mostra o segundo em que o preço visitou a região.",
    });
  }
  if (input.newsStatus === "UNKNOWN") {
    items.push({
      level: "nao_confirmado",
      text: "O contexto de notícias não está disponível. Não foi inventado nenhum evento.",
    });
  }
  for (const item of input.missing) {
    if (item === "SPACE_TO_NEXT_DEFENSE" || item === "TRIGGER" || item === "MINIMUM_CONFLUENCES") continue;
    items.push({ level: "nao_confirmado", text: item });
  }
  return items;
}

function stateText(state: string): string {
  if (state === "OPERAR_COMPRA") return "OPERAR, no lado da compra. A decisão de entrar continua a ser tua.";
  if (state === "OPERAR_VENDA") return "OPERAR, no lado da venda. A decisão de entrar continua a ser tua.";
  if (state === "NAO_OPERAR") return "NÃO OPERAR. A imagem, a notícia ou o gráfico não sustentam a leitura.";
  return "AGUARDAR. Há teoria aplicável, mas falta confirmação.";
}

function count(markings: Marking[], kind: string): number {
  return markings.filter((item) => item.metadata.kind === kind).length;
}

function label(type: string): string {
  const names: Record<string, string> = {
    COMMAND: "Comando",
    SINGLE_RATE: "Taxa única",
    MAGIC_CANDLE: "Candle mágico",
    DIVIDED_RATE: "Taxa dividida",
    NEW_POSITION: "Nova posição",
    FIRST_RECORD: "Primeiro registro",
    CLOSED_PRICE: "Preço fechado",
  };
  return names[type] ?? type;
}
