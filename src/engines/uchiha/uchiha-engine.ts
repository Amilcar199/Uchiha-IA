import { RULE_VERSION } from "@/config/rule-parameters";
import type { DetectedSetup, Marking, RuleResult, TradingRule } from "@/domain/rules/types";
import { classifyFormations, type PriceFormation } from "@/engines/uchiha/formations";
import { readInteraction, type LevelInteraction } from "@/engines/uchiha/interaction";

const COMMAND_SOURCE = {
  document: "Guia de Estudos sobre a Lógica do Preço",
  section: "O que é um comando",
  page: "9",
  description: "Vela sem pavio na abertura. Compra na mínima, venda na máxima. Trava tende a reversão; rompe tende a continuidade. Rompimento sem pavio não é entrada.",
};

const SINGLE_RATE_SOURCE = {
  document: "Guia de Estudos sobre a Lógica do Preço",
  section: "Candle de taxa única",
  page: "13",
  description: "Pavio na abertura e sem pavio no fechamento. Marcação no fechamento. Mesmos filtros de pavio do comando.",
};

export const commandCandleRule: TradingRule = {
  id: "COMMAND_CANDLE",
  name: "Candle de comando",
  version: RULE_VERSION,
  description: COMMAND_SOURCE.description,
  enabled: true,
  source: COMMAND_SOURCE,
  detect(context) {
    const formations = classifyFormations(context.candles).filter((item) => item.kind === "COMMAND");
    return formationResult("COMMAND_CANDLE", formations, context.candles);
  },
};

export const singleRateRule: TradingRule = {
  id: "SINGLE_RATE",
  name: "Taxa única",
  version: RULE_VERSION,
  description: SINGLE_RATE_SOURCE.description,
  enabled: true,
  source: SINGLE_RATE_SOURCE,
  detect(context) {
    const formations = classifyFormations(context.candles).filter((item) => item.kind === "SINGLE_RATE");
    return formationResult("SINGLE_RATE", formations, context.candles);
  },
};

export const magicCandleIdentityRule: TradingRule = {
  id: "MAGIC_CANDLE_IDENTITY",
  name: "Candle mágico — identificação",
  version: RULE_VERSION,
  description:
    "Vela sem pavio nos dois lados. Na fase 1 só é identificado, para não ser lido como comando. Os cenários operacionais ficam para a fase seguinte.",
  enabled: true,
  source: {
    document: "Guia de Estudos sobre a Lógica do Preço",
    section: "Candle mágico",
    description: "Sem pavio em nenhum dos lados. Marca-se abertura e fechamento.",
  },
  detect(context) {
    const formations = classifyFormations(context.candles).filter((item) => item.kind === "MAGIC_CANDLE");
    return {
      triggered: formations.length > 0,
      confidence: formations.length > 0 ? 0.8 : 0,
      evidence: formations.map((formation) => ({
        code: "MAGIC_CANDLE",
        description: "Candle sem pavio na abertura e no fechamento.",
        candleIndex: formation.candleIndex,
        level: formation.level,
      })),
      missingConditions: formations.length > 0 ? ["MAGIC_CANDLE_SCENARIOS_PHASE_2"] : [],
      sourceRuleId: "MAGIC_CANDLE_IDENTITY",
    };
  },
};

function formationResult(ruleId: string, formations: PriceFormation[], candles: import("@/domain/candles/types").Candle[]): RuleResult {
  if (formations.length === 0) {
    return {
      triggered: false,
      confidence: 0,
      evidence: [],
      missingConditions: [],
      sourceRuleId: ruleId,
    };
  }

  const interactions = formations.map((formation) => readInteraction(candles, formation));
  const missing = new Set<string>();
  for (const interaction of interactions) {
    for (const item of interaction.missingConditions) missing.add(item);
  }

  return {
    triggered: true,
    confidence: 0.75,
    evidence: interactions.flatMap((interaction) => interaction.evidence),
    missingConditions: [...missing],
    sourceRuleId: ruleId,
  };
}

export interface UchihaEvaluation {
  ruleResults: RuleResult[];
  markings: Marking[];
  setups: DetectedSetup[];
  interactions: LevelInteraction[];
}

export function evaluateUchiha(context: import("@/domain/rules/types").RuleContext): UchihaEvaluation {
  const rules = [commandCandleRule, singleRateRule, magicCandleIdentityRule].filter((rule) => rule.enabled);
  const ruleResults = rules.map((rule) => rule.detect(context));
  const formations = classifyFormations(context.candles);
  const dividedRateIndexes = dividedRateCandleIndexes(formations);

  const operational = formations.filter(
    (formation) =>
      (formation.kind === "COMMAND" || formation.kind === "SINGLE_RATE") &&
      !dividedRateIndexes.has(formation.candleIndex),
  );

  const interactions = operational.map((formation) => readInteraction(context.candles, formation));
  const markings = formations.map(toMarking);
  const setups = interactions.flatMap((interaction) => toSetups(interaction));

  return { ruleResults, markings, setups, interactions };
}

function dividedRateCandleIndexes(formations: PriceFormation[]): Set<number> {
  const indexes = new Set<number>();
  for (let index = 0; index < formations.length - 1; index += 1) {
    const current = formations[index];
    const next = formations[index + 1];
    if (
      current.kind === "SINGLE_RATE" &&
      next.kind === "COMMAND" &&
      next.candleIndex === current.candleIndex + 1
    ) {
      indexes.add(current.candleIndex);
      indexes.add(next.candleIndex);
    }
  }
  return indexes;
}

function toMarking(formation: PriceFormation): Marking {
  return {
    type:
      formation.kind === "COMMAND"
        ? "COMMAND"
        : formation.kind === "SINGLE_RATE"
          ? "SINGLE_RATE"
          : "MAGIC_CANDLE",
    direction: formation.direction,
    level: formation.level,
    candleIndex: formation.candleIndex,
    confidence: 0.8,
    metadata: {
      open: formation.candle.open,
      close: formation.candle.close,
      operational: formation.kind === "MAGIC_CANDLE" ? "IDENTIFIED_ONLY" : "PHASE_1",
    },
  };
}

function toSetups(interaction: LevelInteraction): DetectedSetup[] {
  if (interaction.ambiguous) {
    return [
      {
        id: `${interaction.formation.kind}-${interaction.formation.candleIndex}-ambiguous`,
        ruleId: interaction.formation.kind === "COMMAND" ? "COMMAND_CANDLE" : "SINGLE_RATE",
        concept: "RETRACAO",
        direction: interaction.formation.direction,
        candleIndex: interaction.formation.candleIndex,
        level: interaction.formation.level,
        structural: true,
        triggerConfirmed: false,
        missingConditions: interaction.missingConditions,
        evidence: interaction.evidence,
        conflicts: [
          {
            code: "RETRACTION_VERSUS_REVERSAL",
            description:
              "O retorno à marcação pode ser retração ou reversão. Os cenários que separam os dois estão em imagem, sem regra textual suficiente.",
          },
        ],
      },
    ];
  }

  if (!interaction.concept || !interaction.direction) return [];

  return [
    {
      id: `${interaction.formation.kind}-${interaction.formation.candleIndex}-break`,
      ruleId: interaction.formation.kind === "COMMAND" ? "COMMAND_CANDLE" : "SINGLE_RATE",
      concept: interaction.concept,
      direction: interaction.direction,
      candleIndex: interaction.breakingCandleIndex ?? interaction.formation.candleIndex,
      level: interaction.formation.level,
      structural: true,
      triggerConfirmed: false,
      missingConditions: interaction.missingConditions,
      evidence: interaction.evidence,
      conflicts: [],
    },
  ];
}
