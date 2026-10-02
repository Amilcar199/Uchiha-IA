import type { Candle } from "@/domain/candles/types";
import type { Direction } from "@/domain/market/types";
import type { RuleParameters } from "@/config/rule-parameters";
import type { SwingPoint } from "@/domain/rules/types";

export interface DefenseLevel {
  price: number;
  candleIndex: number;
  source: "SWING_HIGH" | "SWING_LOW";
}

export interface SpaceAssessment {
  status: "ENOUGH" | "INSUFFICIENT" | "UNCONFIGURED" | "UNKNOWN";
  nextDefense: DefenseLevel | null;
  distanceRatio: number | null;
  touchesDefense: boolean;
  missingConditions: string[];
}

export function defensesFromSwings(swings: SwingPoint[]): DefenseLevel[] {
  return swings.map((swing) => ({
    price: swing.price,
    candleIndex: swing.index,
    source: swing.kind === "high" ? "SWING_HIGH" : "SWING_LOW",
  }));
}

/**
 * Espaço até a próxima defesa.
 * A zona existe quando o preço já reagiu num topo ou fundo.
 * "Suficiente" só é julgado se defenseDistanceRatio estiver configurado.
 */
export function assessSpace(input: {
  candles: Candle[];
  defenses: DefenseLevel[];
  direction: Direction;
  referenceIndex: number;
  parameters: RuleParameters;
}): SpaceAssessment {
  const candle = input.candles.find((item) => item.index === input.referenceIndex) ?? input.candles.at(-1);
  if (!candle) {
    return {
      status: "UNKNOWN",
      nextDefense: null,
      distanceRatio: null,
      touchesDefense: false,
      missingConditions: ["SPACE_TO_NEXT_DEFENSE"],
    };
  }

  const ahead = input.defenses
    .filter((defense) => (input.direction === "BUY" ? defense.price > candle.close : defense.price < candle.close))
    .sort((a, b) => Math.abs(a.price - candle.close) - Math.abs(b.price - candle.close));

  const nextDefense = ahead[0] ?? null;
  if (!nextDefense) {
    return {
      status: "UNKNOWN",
      nextDefense: null,
      distanceRatio: null,
      touchesDefense: false,
      missingConditions: ["NEXT_DEFENSE_NOT_IDENTIFIED"],
    };
  }

  const highs = input.candles.map((item) => item.high);
  const lows = input.candles.map((item) => item.low);
  const visibleRange = Math.max(...highs) - Math.min(...lows);
  const distanceRatio = visibleRange > 0 ? Math.abs(nextDefense.price - candle.close) / visibleRange : null;
  const touchesDefense = candle.low <= nextDefense.price && candle.high >= nextDefense.price;

  if (input.parameters.defenseDistanceRatio == null) {
    return {
      status: "UNCONFIGURED",
      nextDefense,
      distanceRatio,
      touchesDefense,
      missingConditions: ["SPACE_PARAMETER_PENDING_MENTOR_VALIDATION"],
    };
  }

  if (touchesDefense || distanceRatio == null || distanceRatio < input.parameters.defenseDistanceRatio) {
    return {
      status: "INSUFFICIENT",
      nextDefense,
      distanceRatio,
      touchesDefense,
      missingConditions: ["SPACE_TO_NEXT_DEFENSE"],
    };
  }

  return {
    status: "ENOUGH",
    nextDefense,
    distanceRatio,
    touchesDefense: false,
    missingConditions: [],
  };
}
