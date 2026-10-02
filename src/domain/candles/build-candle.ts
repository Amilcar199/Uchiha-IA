import type { Candle, CandleColor, CandleDraft } from "@/domain/candles/types";

const SCALE_EPSILON = 1e-9;

export function candleColor(open: number, close: number): CandleColor {
  if (close > open + SCALE_EPSILON) return "bullish";
  if (close < open - SCALE_EPSILON) return "bearish";
  return "neutral";
}

export function buildCandle(draft: CandleDraft): Candle {
  const { open, close, high, low } = draft;
  if (high + SCALE_EPSILON < Math.max(open, close) || low - SCALE_EPSILON > Math.min(open, close)) {
    throw new Error(`Vela ${draft.index} inconsistente: máxima/mínima não cobrem o corpo.`);
  }

  const upperWick = high - Math.max(open, close);
  const lowerWick = Math.min(open, close) - low;
  const color = candleColor(open, close);
  const priceScale = draft.priceScale ?? "relative";

  return {
    index: draft.index,
    open,
    close,
    high,
    low,
    bodySize: Math.abs(close - open),
    upperWick,
    lowerWick,
    range: high - low,
    color,
    relativeOpen: open,
    relativeClose: close,
    relativeHigh: high,
    relativeLow: low,
    confidence: draft.confidence ?? 1,
    priceScale,
  };
}

export function hasNoWick(wick: number, range: number, epsilonRatio = 0): boolean {
  if (wick <= SCALE_EPSILON) return true;
  if (epsilonRatio <= 0 || range <= SCALE_EPSILON) return false;
  return wick / range <= epsilonRatio;
}
