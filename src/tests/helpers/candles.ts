import { buildCandle } from "@/domain/candles/build-candle";
import type { Candle } from "@/domain/candles/types";

export function candle(
  index: number,
  open: number,
  close: number,
  high: number,
  low: number,
): Candle {
  return buildCandle({ index, open, close, high, low, confidence: 0.9 });
}

/** Corpo com pavio dos dois lados, para não disparar comando nem taxa única. */
export function ordinary(index: number, open: number, close: number): Candle {
  const top = Math.max(open, close);
  const bottom = Math.min(open, close);
  return candle(index, open, close, top + 0.35, bottom - 0.35);
}
