import type { Marking } from "@/domain/rules/types";

export interface ReadingCardModel {
  tone: "buy" | "sell" | "wait" | "block";
  headline: string;
  sentence: string;
  confidence: string;
  marking: string;
  level: string;
  defense: string;
  target: string;
  reasons: string[];
  pending: string[];
  overlay: Marking[];
}

const OPERATIONAL = new Set([
  "COMMAND",
  "SINGLE_RATE",
  "DIVIDED_RATE",
  "MAGIC_CANDLE",
  "CLOSED_PRICE",
  "NEW_POSITION",
  "FIRST_RECORD",
]);

const MARKING_NAME: Record<string, string> = {
  COMMAND: "Comando",
  SINGLE_RATE: "Taxa única",
  DIVIDED_RATE: "Taxa dividida",
  MAGIC_CANDLE: "Candle mágico",
  CLOSED_PRICE: "Preço fechado",
  NEW_POSITION: "Nova posição",
  FIRST_RECORD: "Primeiro registro",
  DEFENSE: "Defesa",
  LIQUIDITY_TARGET: "Alvo de liquidez",
  CONNECTION_TARGET: "Alvo de conexão",
};

const PENDING_NAME: Record<string, string> = {
  SPACE_TO_NEXT_DEFENSE: "Espaço até a próxima defesa",
  SPACE_PARAMETER_PENDING_MENTOR_VALIDATION: "O tamanho do espaço ainda não foi validado pelo mentor",
  NEXT_DEFENSE_NOT_IDENTIFIED: "A próxima defesa não apareceu no print",
  SECONDS_ELAPSED: "Os 15 segundos da vela atual",
  INSIDE_FIRST_15_SECONDS: "A visita ficou fora dos primeiros 15 segundos",
  TIMING_ON_CURRENT_CANDLE: "O tempo tem de ser o da vela que interage com a marcação",
  FIRST_15S_TIMEFRAME_SCOPE: "A regra dos 15 segundos, neste material, vale no M1",
  WICK_ON_BREAKING_CANDLE: "Pavio no candle que rompe",
  RETRACTION_VERSUS_REVERSAL_UNRESOLVED: "Retração e reversão ainda estão empatadas",
  MINIMUM_CONFLUENCES: "Três confluências de grupos diferentes",
  NEWS_STATUS: "Estado da notícia",
  TRIGGER: "Gatilho",
};

export function buildReadingCard(input: {
  state: string;
  confidence: string;
  cycle: string | null;
  trend: string;
  markings: Marking[];
  confluences: { evidence: string }[];
  missing: string[];
  conflicts: string[];
}): ReadingCardModel {
  const tone = toneOf(input.state);
  const operational = latestOperational(input.markings, input.state);
  const defense = latestOf(input.markings, ["DEFENSE"]);
  const target = latestOf(input.markings, ["LIQUIDITY_TARGET", "CONNECTION_TARGET"]);
  const overlay = [operational, defense, target].filter((item): item is Marking => item != null && item.level != null);

  return {
    tone,
    headline: headlineOf(input.state),
    sentence: sentenceOf(input.cycle, input.trend, input.state),
    confidence: confidenceLabel(input.confidence),
    marking: operational ? nameOf(operational) : "Nenhuma marcação operacional confirmada",
    level: operational?.level != null ? formatLevel(operational.level) : "Não confirmado",
    defense: defense?.level != null ? formatLevel(defense.level) : "Não confirmada neste print",
    target: target ? `${nameOf(target)}${target.level != null ? ` · ${formatLevel(target.level)}` : ""}` : "Não confirmado neste print",
    reasons: input.confluences.slice(0, 4).map((item) => item.evidence),
    pending: pendingLines(input.missing, input.conflicts),
    overlay,
  };
}

function latestOperational(markings: Marking[], state: string): Marking | null {
  const wanted = state === "OPERAR_COMPRA" ? "BUY" : state === "OPERAR_VENDA" ? "SELL" : null;
  const pool = markings.filter((item) => OPERATIONAL.has(item.type));
  const aligned = wanted ? pool.filter((item) => item.direction === wanted) : pool;
  const source = aligned.length > 0 ? aligned : pool;
  return source.reduce<Marking | null>((best, item) => {
    if (!best) return item;
    return (item.candleIndex ?? -1) >= (best.candleIndex ?? -1) ? item : best;
  }, null);
}

function latestOf(markings: Marking[], types: string[]): Marking | null {
  return markings.filter((item) => types.includes(item.type)).at(-1) ?? null;
}

function toneOf(state: string): ReadingCardModel["tone"] {
  if (state === "OPERAR_COMPRA") return "buy";
  if (state === "OPERAR_VENDA") return "sell";
  if (state === "NAO_OPERAR") return "block";
  return "wait";
}

function headlineOf(state: string): string {
  if (state === "OPERAR_COMPRA") return "COMPRA";
  if (state === "OPERAR_VENDA") return "VENDA";
  if (state === "NAO_OPERAR") return "NÃO OPERAR";
  return "AGUARDAR";
}

function sentenceOf(cycle: string | null, trend: string, state: string): string {
  const trendText = trend.replaceAll("_", " ").toLowerCase();
  const cycleText = cycle ? cycle.replaceAll("_", " ").toLowerCase() : "ciclo ainda não classificado";
  if (state === "OPERAR_COMPRA" || state === "OPERAR_VENDA") {
    return `A marcação, o ciclo e o gatilho apontam o mesmo lado. Tendência ${trendText}, ${cycleText}.`;
  }
  if (state === "NAO_OPERAR") {
    return `A imagem, a notícia ou a estrutura não sustentam uma leitura. Tendência ${trendText}.`;
  }
  return `Há estrutura para ler, mas falta confirmação. Tendência ${trendText}, ${cycleText}.`;
}

function confidenceLabel(value: string): string {
  if (value === "alta") return "Alta";
  if (value === "baixa") return "Baixa";
  return "Média";
}

function nameOf(marking: Marking): string {
  const classic = typeof marking.metadata.name === "string" ? marking.metadata.name : null;
  return classic ?? MARKING_NAME[marking.type] ?? marking.type;
}

function formatLevel(level: number): string {
  return level.toFixed(4);
}

function pendingLines(missing: string[], conflicts: string[]): string[] {
  const lines = [...missing, ...conflicts].map((item) => PENDING_NAME[item] ?? item.replaceAll("_", " ").toLowerCase());
  return [...new Set(lines)].slice(0, 4);
}
