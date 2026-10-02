import sharp from "sharp";

export interface DrawnCandle {
  open: number;
  close: number;
  high: number;
  low: number;
}

export async function renderChart(input: {
  candles: DrawnCandle[];
  width?: number;
  height?: number;
  theme?: "dark" | "light";
  sidebar?: boolean;
}): Promise<Buffer> {
  const width = input.width ?? 960;
  const height = input.height ?? 540;
  const theme = input.theme ?? "dark";
  const background = theme === "dark" ? { r: 19, g: 23, b: 34 } : { r: 255, g: 255, b: 255 };
  const bull = theme === "dark" ? { r: 38, g: 166, b: 154 } : { r: 8, g: 153, b: 129 };
  const bear = theme === "dark" ? { r: 239, g: 83, b: 80 } : { r: 242, g: 54, b: 69 };

  const channels = 4;
  const pixels = Buffer.alloc(width * height * channels, 0);
  for (let index = 0; index < width * height; index += 1) {
    const offset = index * channels;
    pixels[offset] = background.r;
    pixels[offset + 1] = background.g;
    pixels[offset + 2] = background.b;
    pixels[offset + 3] = 255;
  }

  const padLeft = 48;
  const padRight = input.sidebar ? 180 : 72;
  const padTop = 36;
  const padBottom = 36;
  const plotBottom = height - padBottom;
  const plotHeight = plotBottom - padTop;
  const prices = input.candles.flatMap((candle) => [candle.high, candle.low]);
  const minPrice = Math.min(...prices);
  const maxPrice = Math.max(...prices);
  const span = maxPrice - minPrice || 1;
  const yOf = (price: number) => padTop + ((maxPrice - price) / span) * plotHeight;

  const plotWidth = width - padLeft - padRight;
  const slot = plotWidth / input.candles.length;

  input.candles.forEach((candle, index) => {
    const center = Math.round(padLeft + slot * index + slot / 2);
    const color = candle.close >= candle.open ? bull : bear;
    const highY = Math.round(yOf(candle.high));
    const lowY = Math.round(yOf(candle.low));
    const bodyTop = Math.round(yOf(Math.max(candle.open, candle.close)));
    const bodyBottom = Math.round(yOf(Math.min(candle.open, candle.close)));
    paintVertical(pixels, width, height, center, highY, lowY, color);
    for (let x = center - 3; x <= center + 3; x += 1) {
      paintVertical(pixels, width, height, x, bodyTop, Math.max(bodyTop, bodyBottom), color);
    }
  });

  if (input.sidebar) {
    for (let y = 0; y < height; y += 1) {
      for (let x = width - 150; x < width; x += 1) {
        const offset = (y * width + x) * channels;
        pixels[offset] = 32;
        pixels[offset + 1] = 36;
        pixels[offset + 2] = 48;
        pixels[offset + 3] = 255;
      }
    }
  }

  return sharp(pixels, { raw: { width, height, channels } }).png().toBuffer();
}

function paintVertical(
  pixels: Buffer,
  width: number,
  height: number,
  x: number,
  y1: number,
  y2: number,
  color: { r: number; g: number; b: number },
) {
  if (x < 0 || x >= width) return;
  const start = Math.max(0, Math.min(y1, y2));
  const end = Math.min(height - 1, Math.max(y1, y2));
  for (let y = start; y <= end; y += 1) {
    const offset = (y * width + x) * 4;
    pixels[offset] = color.r;
    pixels[offset + 1] = color.g;
    pixels[offset + 2] = color.b;
    pixels[offset + 3] = 255;
  }
}
