import type { Candle } from "@/domain/candles/types";
import type { SwingPoint } from "@/domain/rules/types";

const NEIGHBORHOOD = 2;

/**
 * Topo: máxima estritamente maior que as velas vizinhas visíveis.
 * Fundo: mínima estritamente menor que as velas vizinhas visíveis.
 * Só usa velas já presentes na leitura. Não consulta velas futuras fora da série recebida.
 */
export function detectSwings(candles: Candle[]): SwingPoint[] {
  const swings: SwingPoint[] = [];

  for (let index = NEIGHBORHOOD; index < candles.length - NEIGHBORHOOD; index += 1) {
    const candle = candles[index];
    const neighbors = [
      ...candles.slice(index - NEIGHBORHOOD, index),
      ...candles.slice(index + 1, index + 1 + NEIGHBORHOOD),
    ];

    if (neighbors.every((item) => candle.high > item.high)) {
      swings.push({ index, price: candle.high, kind: "high" });
    }
    if (neighbors.every((item) => candle.low < item.low)) {
      swings.push({ index, price: candle.low, kind: "low" });
    }
  }

  return swings;
}

export function swingHighs(swings: SwingPoint[]): SwingPoint[] {
  return swings.filter((swing) => swing.kind === "high");
}

export function swingLows(swings: SwingPoint[]): SwingPoint[] {
  return swings.filter((swing) => swing.kind === "low");
}
