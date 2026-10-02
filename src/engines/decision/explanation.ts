import type { AnalysisDecision } from "@/domain/decisions/types";
import type { Confluence } from "@/domain/rules/types";
import type { NewsAssessment } from "@/engines/news/news-engine";
import type { TimingResult } from "@/engines/sharingan/sharingan-engine";
import type { MarketContext } from "@/engines/supreme/supreme-engine";

const STATE_LABEL: Record<AnalysisDecision["state"], string> = {
  OPERAR_COMPRA: "OPERAR COMPRA",
  OPERAR_VENDA: "OPERAR VENDA",
  AGUARDAR: "AGUARDAR",
  NAO_OPERAR: "NÃO OPERAR",
};

export function buildExplanation(input: {
  decision: AnalysisDecision;
  context: MarketContext;
  news: NewsAssessment;
  timing: TimingResult;
  confluences: Confluence[];
}): string[] {
  const lines = [`DECISÃO: ${STATE_LABEL[input.decision.state]}`];

  if (input.context.cycle) {
    lines.push(`O ciclo lido é ${input.context.cycle.replaceAll("_", " ").toLowerCase()}.`);
  } else {
    lines.push("O ciclo não foi classificado. Falta estrutura de topos e fundos suficiente.");
  }

  lines.push(`A tendência está ${input.context.trend.toLowerCase()}.`);

  if (input.confluences.length === 0) {
    lines.push("Não há confluências independentes suficientes para uma entrada.");
  } else {
    lines.push(
      `Confluências independentes: ${new Set(input.confluences.map((item) => item.family)).size}.`,
    );
    for (const confluence of input.confluences) {
      lines.push(confluence.evidence);
    }
  }

  if (input.timing.confirmed) {
    lines.push("O gatilho temporal foi informado dentro da janela dos 15 segundos da vela atual.");
  } else if (input.timing.missingConditions.length > 0) {
    lines.push("O gatilho ainda não está confirmado.");
  }

  if (input.news.status === "FREE") {
    lines.push("Não foi declarada notícia de bloqueio. O calendário automático não está ligado.");
  } else if (input.news.status === "BLOCKED") {
    lines.push(input.news.notes.at(-1) ?? "Notícia em bloqueio.");
  } else if (input.news.status === "UNKNOWN") {
    lines.push("O estado de notícia não foi informado.");
  }

  if (input.decision.missingConditions.length > 0) {
    lines.push("Ainda falta:");
    for (const item of input.decision.missingConditions) lines.push(item);
  }

  lines.push(
    "A confiança abaixo descreve a leitura, não a probabilidade de ganho. A decisão de operar continua com o utilizador.",
  );

  return lines;
}
