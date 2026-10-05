import sharp from "sharp";
import { buildCandle } from "@/domain/candles/build-candle";
import type { Candle, CandleColor } from "@/domain/candles/types";
import { validateImageSize, type ImageValidation } from "@/engines/vision/image-validator";

export interface VisionReport {
  candles: Candle[];
  validation: ImageValidation;
  globalConfidence: number;
  insufficientContext: boolean;
  warnings: string[];
  chartRegion: { left: number; top: number; right: number; bottom: number } | null;
  priceScale: "relative";
}

type PixelClass = "bull" | "bear" | "none";

export async function analyzeImage(input: Buffer, minimumForContext: number): Promise<VisionReport> {
  const image = sharp(input).ensureAlpha();
  const metadata = await image.metadata();
  const width = metadata.width ?? 0;
  const height = metadata.height ?? 0;
  const validation = validateImageSize(width, height);

  if (!validation.accepted) {
    return {
      candles: [],
      validation,
      globalConfidence: 0,
      insufficientContext: true,
      warnings: validation.blockers,
      chartRegion: null,
      priceScale: "relative",
    };
  }

  const { data, info } = await image.raw().toBuffer({ resolveWithObject: true });
  const classes = classifyPixels(data, info.width, info.height, info.channels);
  const extracted = extractCandles(classes, info.width, info.height);

  if (extracted.candles.length < 5) {
    return {
      candles: extracted.candles,
      validation: {
        ...validation,
        accepted: false,
        blockers: ["INSUFFICIENT_VISUAL_EVIDENCE"],
        code: "VISION_001",
        userMessage:
          "Não foi possível identificar candles suficientes no gráfico. Envie uma imagem com maior resolução e mais candles visíveis.",
      },
      globalConfidence: 0.2,
      insufficientContext: true,
      warnings: ["INSUFFICIENT_VISUAL_EVIDENCE"],
      chartRegion: extracted.region,
      priceScale: "relative",
    };
  }

  const warnings = [...extracted.warnings];
  const insufficientContext = extracted.candles.length < minimumForContext;
  if (insufficientContext) warnings.push("INSUFFICIENT_CONTEXT");

  const globalConfidence = average(extracted.candles.map((candle) => candle.confidence));

  return {
    candles: extracted.candles,
    validation,
    globalConfidence,
    insufficientContext,
    warnings,
    chartRegion: extracted.region,
    priceScale: "relative",
  };
}

function classifyPixels(data: Buffer, width: number, height: number, channels: number): PixelClass[] {
  const classes: PixelClass[] = new Array(width * height);
  for (let index = 0; index < width * height; index += 1) {
    const offset = index * channels;
    const red = data[offset];
    const green = data[offset + 1];
    const blue = data[offset + 2];
    classes[index] = classifyColor(red, green, blue);
  }
  return classes;
}

function classifyColor(red: number, green: number, blue: number): PixelClass {
  // Verde e vermelho, incluindo o verde-azulado dos gráficos escuros.
  if (green > 60 && green >= red + 12 && green + 15 >= blue) return "bull";
  if (red > 60 && red >= green + 12 && red >= blue) return "bear";
  return "none";
}

function extractCandles(classes: PixelClass[], width: number, height: number): {
  candles: Candle[];
  region: { left: number; top: number; right: number; bottom: number } | null;
  warnings: string[];
} {
  const columnCounts = new Array(width).fill(0);
  let minX = width;
  let maxX = 0;
  let minY = height;
  let maxY = 0;

  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      if (classes[y * width + x] === "none") continue;
      columnCounts[x] += 1;
      if (x < minX) minX = x;
      if (x > maxX) maxX = x;
      if (y < minY) minY = y;
      if (y > maxY) maxY = y;
    }
  }

  if (maxX <= minX || maxY <= minY) {
    return { candles: [], region: null, warnings: ["CHART_REGION_NOT_FOUND"] };
  }

  const runs = groupColumns(columnCounts, minX, maxX);
  const regionHeight = maxY - minY || 1;
  const candles: Candle[] = [];

  runs.forEach((run, index) => {
    const draft = candleFromRun(classes, width, run.start, run.end, minY, maxY, index);
    if (draft) candles.push(draft);
  });

  return {
    candles,
    region: { left: minX, top: minY, right: maxX, bottom: maxY },
    warnings: regionHeight < 40 ? ["SHORT_PRICE_AXIS"] : [],
  };
}

function groupColumns(counts: number[], minX: number, maxX: number): Array<{ start: number; end: number }> {
  const runs: Array<{ start: number; end: number }> = [];
  let start = -1;
  let gap = 0;

  for (let x = minX; x <= maxX; x += 1) {
    if (counts[x] >= 3) {
      if (start < 0) start = x;
      gap = 0;
      continue;
    }
    gap += 1;
    if (start >= 0 && gap > 2) {
      runs.push({ start, end: x - gap });
      start = -1;
    }
  }

  if (start >= 0) runs.push({ start, end: maxX });
  return runs.filter((run) => run.end - run.start >= 2);
}

function candleFromRun(
  classes: PixelClass[],
  width: number,
  start: number,
  end: number,
  regionTop: number,
  regionBottom: number,
  index: number,
): Candle | null {
  const rowCounts: number[] = [];
  let bull = 0;
  let bear = 0;
  let extremeTop = regionBottom;
  let extremeBottom = regionTop;

  for (let y = regionTop; y <= regionBottom; y += 1) {
    let count = 0;
    for (let x = start; x <= end; x += 1) {
      const pixel = classes[y * width + x];
      if (pixel === "none") continue;
      count += 1;
      if (pixel === "bull") bull += 1;
      else bear += 1;
    }
    rowCounts[y] = count;
    if (count > 0) {
      if (y < extremeTop) extremeTop = y;
      if (y > extremeBottom) extremeBottom = y;
    }
  }

  let maxCount = 0;
  for (let y = extremeTop; y <= extremeBottom; y += 1) {
    if ((rowCounts[y] ?? 0) > maxCount) maxCount = rowCounts[y];
  }
  if (maxCount < 2 || bull + bear < 8) return null;

  const bodyThreshold = Math.max(2, Math.ceil(maxCount * 0.55));
  let bodyTop = -1;
  let bodyBottom = -1;
  for (let y = extremeTop; y <= extremeBottom; y += 1) {
    if ((rowCounts[y] ?? 0) >= bodyThreshold) {
      if (bodyTop < 0) bodyTop = y;
      bodyBottom = y;
    }
  }
  if (bodyTop < 0 || bodyBottom < 0) return null;

  const span = regionBottom - regionTop || 1;
  const priceAt = (y: number) => (regionBottom - y) / span;
  const color: CandleColor = bull === bear ? "neutral" : bull > bear ? "bullish" : "bearish";
  if (color === "neutral") return null;

  const high = priceAt(extremeTop);
  const low = priceAt(extremeBottom);
  const bodyHigh = priceAt(bodyTop);
  const bodyLow = priceAt(bodyBottom);
  const open = color === "bullish" ? bodyLow : bodyHigh;
  const close = color === "bullish" ? bodyHigh : bodyLow;
  const confidence = Math.min(0.95, 0.55 + Math.abs(bull - bear) / (bull + bear));

  return buildCandle({
    index,
    open,
    close,
    high: Math.max(high, open, close),
    low: Math.min(low, open, close),
    confidence,
    priceScale: "relative",
  });
}

function average(values: number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}
