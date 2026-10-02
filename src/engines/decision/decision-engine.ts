import type { AnalysisDecision, DecisionState, ReadingConfidence } from "@/domain/decisions/types";
import type { Confluence } from "@/domain/rules/types";
import { RULE_VERSION } from "@/config/rule-parameters";

export interface DecisionInput {
  imageAccepted: boolean;
  imageBlockers: string[];
  metadataComplete: boolean;
  metadataMissing: string[];
  newsBlocks: boolean;
  newsCaution: boolean;
  newsMissing: string[];
  contextOperable: boolean;
  contextMissing: string[];
  insufficientContext: boolean;
  confluences: Confluence[];
  independentCount: number;
  favoredDirection: "BUY" | "SELL" | null;
  conflicts: string[];
  triggerConfirmed: boolean;
  triggerMissing: string[];
  spaceStatus: "ENOUGH" | "INSUFFICIENT" | "UNCONFIGURED" | "UNKNOWN" | "NOT_EVALUATED";
  spaceMissing: string[];
  minimumConfluences?: number;
  readingScore: number;
}

export function evaluateDecision(input: DecisionInput): AnalysisDecision {
  const blockers: string[] = [];
  const missing = new Set<string>();

  if (!input.imageAccepted) {
    blockers.push(...input.imageBlockers);
    return decision("NAO_OPERAR", input, blockers, [...missing], "A imagem não sustenta uma leitura.");
  }

  if (!input.metadataComplete) {
    for (const item of input.metadataMissing) missing.add(item);
    return decision(
      "AGUARDAR",
      input,
      blockers,
      [...missing],
      "Faltam dados da análise: ativo, regime ou timeframe.",
    );
  }

  if (input.newsBlocks) {
    blockers.push("NEWS_BLOCKED");
    return decision(
      "NAO_OPERAR",
      input,
      blockers,
      [...missing],
      "Há notícia de alto impacto declarada para o mercado real. A leitura fica bloqueada.",
    );
  }

  if (input.newsCaution) {
    blockers.push("OTC_NEWS_CAUTION");
    return decision(
      "AGUARDAR",
      input,
      blockers,
      [...missing, ...input.newsMissing],
      "No OTC a notícia não é tratada como causa do preço. A declaração de bloqueio entra como cautela.",
    );
  }

  for (const item of input.newsMissing) missing.add(item);
  for (const item of input.contextMissing) missing.add(item);
  for (const item of input.triggerMissing) missing.add(item);
  for (const item of input.spaceMissing) missing.add(item);

  if (!input.contextOperable) {
    return decision(
      "AGUARDAR",
      input,
      blockers,
      [...missing],
      "O contexto ainda não autoriza um operacional. Sem ciclo classificado, a leitura não força entrada.",
    );
  }

  if (input.conflicts.length > 0) {
    blockers.push(...input.conflicts);
    return decision(
      "AGUARDAR",
      input,
      blockers,
      [...missing],
      "Há leituras que não apontam para o mesmo lado. Sinais contraditórios ficam em espera.",
    );
  }

  const minimum = input.minimumConfluences ?? 3;
  if (input.independentCount < minimum || !input.favoredDirection) {
    missing.add("MINIMUM_CONFLUENCES");
    return decision(
      "AGUARDAR",
      input,
      blockers,
      [...missing],
      `A leitura tem ${input.independentCount} confluência(s) independente(s). O mínimo para operar é ${minimum}.`,
    );
  }

  if (!input.triggerConfirmed) {
    missing.add("TRIGGER");
    return decision(
      "AGUARDAR",
      input,
      blockers,
      [...missing],
      "O contexto pode estar favorável, mas o gatilho ainda não foi confirmado.",
    );
  }

  if (input.spaceStatus !== "ENOUGH") {
    missing.add("SPACE_TO_NEXT_DEFENSE");
    return decision(
      "AGUARDAR",
      input,
      blockers,
      [...missing],
      "Não há confirmação de espaço até a próxima defesa. Sem esse parâmetro validado, a entrada não é sugerida.",
    );
  }

  if (input.insufficientContext) {
    missing.add("INSUFFICIENT_CONTEXT");
    return decision(
      "AGUARDAR",
      input,
      blockers,
      [...missing],
      "As velas visíveis não chegam ao contexto pedido de 15 a 20 candles.",
    );
  }

  const state = input.favoredDirection === "BUY" ? "OPERAR_COMPRA" : "OPERAR_VENDA";
  return decision(
    state,
    input,
    blockers,
    [...missing],
    state === "OPERAR_COMPRA"
      ? "Os gates de imagem, notícia, contexto, confluência, gatilho e espaço foram atendidos para compra."
      : "Os gates de imagem, notícia, contexto, confluência, gatilho e espaço foram atendidos para venda.",
  );
}

function decision(
  state: DecisionState,
  input: DecisionInput,
  blockers: string[],
  missingConditions: string[],
  explanation: string,
): AnalysisDecision {
  return {
    state,
    confidence: readingConfidence(input, state),
    confluences: input.confluences,
    missingConditions: unique(missingConditions),
    blockers: unique(blockers),
    explanation,
    ruleVersion: RULE_VERSION,
  };
}

function readingConfidence(input: DecisionInput, state: DecisionState): ReadingConfidence {
  if (!input.imageAccepted || input.readingScore < 0.45) return "baixa";
  if (state === "OPERAR_COMPRA" || state === "OPERAR_VENDA") {
    return input.readingScore >= 0.8 ? "alta" : "media";
  }
  if (input.readingScore >= 0.75 && input.independentCount >= 2) return "media";
  return "baixa";
}

function unique(values: string[]): string[] {
  return [...new Set(values.filter(Boolean))];
}
