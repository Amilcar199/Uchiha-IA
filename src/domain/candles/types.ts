export type CandleColor = "bullish" | "bearish" | "neutral";

export type PriceScale = "relative" | "absolute";

/**
 * Vela estruturada.
 * Quando o print não traz preço absoluto, open/high/low/close ficam na escala
 * relativa da área visível do gráfico. Nada é inventado para preencher preço.
 */
export interface Candle {
  index: number;
  open: number;
  close: number;
  high: number;
  low: number;
  bodySize: number;
  upperWick: number;
  lowerWick: number;
  range: number;
  color: CandleColor;
  relativeOpen: number;
  relativeClose: number;
  relativeHigh: number;
  relativeLow: number;
  confidence: number;
  priceScale: PriceScale;
}

export interface CandleDraft {
  index: number;
  open: number;
  close: number;
  high: number;
  low: number;
  confidence?: number;
  priceScale?: PriceScale;
}
