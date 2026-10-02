import type { Candle } from "@/domain/candles/types";

export interface ScalpProfile {
  enabled: boolean;
  blocked: boolean;
  reason: string | null;
}

/**
 * Scalping 5s. Desligado por padrão.
 * A sequência acima de 5 velas e a observação dos últimos 5 segundos estão no material.
 */
export function evaluateScalp5s(input: {
  enabled: boolean;
  candles: Candle[];
  secondsElapsed: number | null;
  timeframe: string;
}): ScalpProfile {
  if (!input.enabled) {
    return { enabled: false, blocked: false, reason: null };
  }
  if (input.secondsElapsed == null) {
    return { enabled: true, blocked: true, reason: "O perfil 5s precisa dos segundos da vela atual." };
  }
  const streak = trailingSameColor(input.candles);
  if (streak > 5) {
    return { enabled: true, blocked: true, reason: "Mais de 5 velas na mesma direção. O perfil 5s trata isso como exaustão." };
  }
  if (input.timeframe === "M1" && input.secondsElapsed < 55 && input.secondsElapsed > 5) {
    return {
      enabled: true,
      blocked: true,
      reason: "O perfil 5s observa os últimos 5 segundos da vela e a entrada no início da seguinte.",
    };
  }
  return { enabled: true, blocked: false, reason: null };
}

function trailingSameColor(candles: Candle[]): number {
  const last = candles[candles.length - 1];
  if (!last || last.color === "neutral") return 0;
  let count = 0;
  for (let index = candles.length - 1; index >= 0; index -= 1) {
    if (candles[index].color !== last.color) break;
    count += 1;
  }
  return count;
}
