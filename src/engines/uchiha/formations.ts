import { hasNoWick } from "@/domain/candles/build-candle";
import type { Candle } from "@/domain/candles/types";
import type { Direction } from "@/domain/market/types";

export type FormationKind = "COMMAND" | "SINGLE_RATE" | "MAGIC_CANDLE";

export interface PriceFormation {
  kind: FormationKind;
  direction: Direction;
  candleIndex: number;
  level: number;
  candle: Candle;
}

/**
 * Comando: sem pavio na abertura.
 * Compra abre na mínima. Venda abre na máxima.
 * Candle mágico (sem pavio nos dois lados) é mais específico e não entra como comando.
 * Taxa única: pavio na abertura e sem pavio no fechamento.
 */
export function classifyFormation(candle: Candle, wickEpsilonRatio = 0): PriceFormation | null {
  if (candle.color === "neutral" || candle.bodySize <= 0 || candle.range <= 0) return null;

  const noUpper = hasNoWick(candle.upperWick, candle.range, wickEpsilonRatio);
  const noLower = hasNoWick(candle.lowerWick, candle.range, wickEpsilonRatio);

  if (noUpper && noLower) {
    return {
      kind: "MAGIC_CANDLE",
      direction: candle.color === "bullish" ? "BUY" : "SELL",
      candleIndex: candle.index,
      level: candle.open,
      candle,
    };
  }

  if (candle.color === "bullish" && noLower && !noUpper) {
    return {
      kind: "COMMAND",
      direction: "BUY",
      candleIndex: candle.index,
      level: candle.open,
      candle,
    };
  }

  if (candle.color === "bearish" && noUpper && !noLower) {
    return {
      kind: "COMMAND",
      direction: "SELL",
      candleIndex: candle.index,
      level: candle.open,
      candle,
    };
  }

  if (candle.color === "bullish" && !noLower && noUpper) {
    return {
      kind: "SINGLE_RATE",
      direction: "BUY",
      candleIndex: candle.index,
      level: candle.close,
      candle,
    };
  }

  if (candle.color === "bearish" && !noUpper && noLower) {
    return {
      kind: "SINGLE_RATE",
      direction: "SELL",
      candleIndex: candle.index,
      level: candle.close,
      candle,
    };
  }

  return null;
}

export function classifyFormations(candles: Candle[], wickEpsilonRatio = 0): PriceFormation[] {
  return candles.flatMap((candle) => {
    const formation = classifyFormation(candle, wickEpsilonRatio);
    return formation ? [formation] : [];
  });
}
