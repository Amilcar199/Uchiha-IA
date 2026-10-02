import type { RuleParameters } from "@/config/rule-parameters";
import type { Candle } from "@/domain/candles/types";
import type { Marking } from "@/domain/rules/types";

/**
 * Vocabulário Lorenz. Os percentuais estão na especificação do motor.
 * Contam, no máximo, como uma confluência e nunca abrem uma entrada sozinhos.
 */
export function detectClassics(candles: Candle[], parameters: RuleParameters): Marking[] {
  const found: Marking[] = [];
  const { hammerWickShare, dragonflyWickShare, marubozuBodyShare, marubozuWickShare } = parameters.lorenz;

  for (let index = 0; index < candles.length; index += 1) {
    const candle = candles[index];
    const previous = index > 0 ? candles[index - 1] : null;
    if (candle.range <= 0) continue;
    const afterDrop = previous != null && (previous.color === "bearish" || previous.close > candle.close);
    const afterRise = previous != null && (previous.color === "bullish" || previous.close < candle.close);
    const lowerShare = candle.lowerWick / candle.range;
    const upperShare = candle.upperWick / candle.range;
    const bodyShare = candle.bodySize / candle.range;

    if (afterDrop && lowerShare >= hammerWickShare && candle.upperWick <= 1e-9) {
      found.push(classic(candle, "martelo", "possível reversão altista"));
    }
    if (afterRise && lowerShare >= hammerWickShare && candle.upperWick <= 1e-9) {
      found.push(classic(candle, "enforcado", "possível reversão baixista"));
    }
    if (afterDrop && candle.color === "neutral" && lowerShare >= dragonflyWickShare) {
      found.push(classic(candle, "doji libélula", "possível reversão altista"));
    }
    if (afterRise && candle.color === "neutral" && upperShare >= dragonflyWickShare) {
      found.push(classic(candle, "doji túmulo", "possível reversão baixista"));
    }
    if (afterDrop && upperShare >= hammerWickShare && bodyShare + lowerShare <= 1 - hammerWickShare) {
      found.push(classic(candle, "martelo invertido", "possível reversão altista"));
    }
    if (afterRise && upperShare >= hammerWickShare && bodyShare + lowerShare <= 1 - hammerWickShare) {
      found.push(classic(candle, "estrela cadente", "possível reversão baixista"));
    }
    if (isMarubozu(candles, index, marubozuBodyShare, marubozuWickShare)) {
      found.push(classic(candle, "marubozu", "depende do contexto"));
    }
    if (previous && engulfs(candle, previous)) {
      found.push(classic(candle, candle.color === "bullish" ? "engolfo de alta" : "engolfo de baixa", "reversão"));
    }
    if (previous && harami(candle, previous)) {
      found.push(classic(candle, candle.color === "bullish" ? "harami de alta" : "harami de baixa", "possível reversão"));
    }
    if (previous?.color === "bearish" && candle.color === "bullish" && candle.close > (previous.open + previous.close) / 2) {
      found.push(classic(candle, "penetrante", "reversão altista"));
    }
    if (
      previous?.color === "bullish" &&
      candle.color === "bearish" &&
      candle.open > previous.high &&
      candle.close < (previous.open + previous.close) / 2
    ) {
      found.push(classic(candle, "nuvem negra", "reversão baixista"));
    }
    if (candle.color === "neutral") {
      found.push(classic(candle, "doji de dúvida", "indecisão"));
    }
  }
  return found;
}

function isMarubozu(candles: Candle[], index: number, bodyShare: number, wickShare: number): boolean {
  const candle = candles[index];
  if (index === 0 || candle.range <= 0) return false;
  const shadows = (candle.upperWick + candle.lowerWick) / candle.range;
  if (candle.bodySize / candle.range < bodyShare || shadows > wickShare) return false;
  const previous = candles.slice(Math.max(0, index - 20), index);
  return previous.every((item) => candle.range > item.range);
}

function engulfs(current: Candle, previous: Candle): boolean {
  if (current.color === "neutral" || previous.color === "neutral" || current.color === previous.color) return false;
  const currentTop = Math.max(current.open, current.close);
  const currentBottom = Math.min(current.open, current.close);
  const previousTop = Math.max(previous.open, previous.close);
  const previousBottom = Math.min(previous.open, previous.close);
  return currentTop >= previousTop && currentBottom <= previousBottom && current.bodySize > previous.bodySize;
}

function harami(current: Candle, previous: Candle): boolean {
  if (current.color === "neutral" || previous.color === "neutral") return false;
  const currentTop = Math.max(current.open, current.close);
  const currentBottom = Math.min(current.open, current.close);
  const previousTop = Math.max(previous.open, previous.close);
  const previousBottom = Math.min(previous.open, previous.close);
  const inside = currentTop <= previousTop && currentBottom >= previousBottom;
  const bothEndsMatch = currentTop === previousTop && currentBottom === previousBottom;
  return inside && !bothEndsMatch && current.bodySize < previous.bodySize;
}

function classic(candle: Candle, name: string, reading: string): Marking {
  return {
    type: "CLASSIC",
    direction: candle.color === "bullish" ? "BUY" : candle.color === "bearish" ? "SELL" : null,
    level: candle.close,
    candleIndex: candle.index,
    confidence: 0.6,
    metadata: { name, reading, source: "Lorenz" },
  };
}
