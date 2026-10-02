import type { AssetPair, MarketRegime, NewsStatus } from "@/domain/market/types";

export interface NewsAssessment {
  status: NewsStatus;
  base: string | null;
  quote: string | null;
  source: "USER_DECLARATION" | "UNAVAILABLE";
  blocksDecision: boolean;
  cautionOnly: boolean;
  missingConditions: string[];
  notes: string[];
}

export function splitAssetPair(asset: string): AssetPair {
  const withoutRegime = asset.replace(/-?OTC$/i, "").trim().toUpperCase();
  const parts = withoutRegime.split(/[/\-_]/).filter(Boolean);
  if (parts.length !== 2 || parts.some((part) => part.length < 2 || part.length > 6)) {
    return { raw: asset, base: null, quote: null };
  }
  return { raw: asset, base: parts[0], quote: parts[1] };
}

/**
 * Fase 1 não consulta calendário externo.
 * A licença da fonte ainda não foi escolhida, e a janela de bloqueio está pendente.
 * O que existe é a declaração do utilizador.
 */
export function evaluateNews(input: {
  asset: string;
  marketRegime: MarketRegime;
  declaration: NewsStatus;
}): NewsAssessment {
  const pair = splitAssetPair(input.asset);
  const notes = [
    "Calendário automático não está ligado nesta versão. O estado de notícia é a declaração de quem enviou o print.",
  ];

  if (!pair.base || !pair.quote) {
    notes.push("Não foi possível separar moeda base e moeda de cotação.");
  }

  if (input.declaration === "UNKNOWN") {
    return {
      status: "UNKNOWN",
      base: pair.base,
      quote: pair.quote,
      source: "UNAVAILABLE",
      blocksDecision: false,
      cautionOnly: false,
      missingConditions: ["NEWS_STATUS"],
      notes,
    };
  }

  if (input.declaration === "BLOCKED") {
    if (input.marketRegime === "OTC") {
      return {
        status: "BLOCKED",
        base: pair.base,
        quote: pair.quote,
        source: "USER_DECLARATION",
        blocksDecision: false,
        cautionOnly: true,
        missingConditions: ["OTC_NEWS_CAUTION"],
        notes: [
          ...notes,
          "No OTC a notícia não explica o preço sintético. Entra só como cautela, então a leitura não avança para operar.",
        ],
      };
    }

    return {
      status: "BLOCKED",
      base: pair.base,
      quote: pair.quote,
      source: "USER_DECLARATION",
      blocksDecision: true,
      cautionOnly: false,
      missingConditions: [],
      notes: [...notes, "Notícia de alto impacto declarada no mercado real. O gate de notícia bloqueia a operação."],
    };
  }

  if (input.declaration === "ATTENTION") {
    notes.push("Evento de atenção declarado. Não bloqueia sozinho; a janela automática continua pendente.");
  }

  return {
    status: input.declaration,
    base: pair.base,
    quote: pair.quote,
    source: "USER_DECLARATION",
    blocksDecision: false,
    cautionOnly: false,
    missingConditions: pair.base ? [] : ["PAIR_DECOMPOSITION"],
    notes,
  };
}
