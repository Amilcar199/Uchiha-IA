import { decode as decodeJpeg } from "jpeg-js";
import { PNG } from "pngjs";

export interface Raster {
  data: Buffer;
  width: number;
  height: number;
}

export function rasterFromImage(input: Buffer, maxSide = 1200): Raster {
  return downsample(decodeAny(input), maxSide);
}

export function pngFromImage(input: Buffer, maxSide = 1200): Buffer {
  const raster = rasterFromImage(input, maxSide);
  const png = new PNG({ width: raster.width, height: raster.height });
  raster.data.copy(png.data);
  return PNG.sync.write(png);
}

function decodeAny(input: Buffer): Raster {
  if (isPng(input)) {
    const png = PNG.sync.read(input);
    return { data: Buffer.from(png.data), width: png.width, height: png.height };
  }
  if (isJpeg(input)) {
    const jpeg = decodeJpeg(input, {
      useTArray: true,
      formatAsRGBA: true,
      maxMemoryUsageInMB: 128,
      maxResolutionInMP: 24,
    });
    return { data: Buffer.from(jpeg.data), width: jpeg.width, height: jpeg.height };
  }
  throw new Error("FORMATO");
}

function downsample(raster: Raster, maxSide: number): Raster {
  const scale = Math.min(1, maxSide / Math.max(raster.width, raster.height));
  if (scale === 1) return raster;
  const width = Math.max(1, Math.round(raster.width * scale));
  const height = Math.max(1, Math.round(raster.height * scale));
  const data = Buffer.alloc(width * height * 4);
  for (let y = 0; y < height; y += 1) {
    const sourceY = Math.min(raster.height - 1, Math.floor(y / scale));
    for (let x = 0; x < width; x += 1) {
      const sourceX = Math.min(raster.width - 1, Math.floor(x / scale));
      const source = (sourceY * raster.width + sourceX) * 4;
      const target = (y * width + x) * 4;
      data[target] = raster.data[source];
      data[target + 1] = raster.data[source + 1];
      data[target + 2] = raster.data[source + 2];
      data[target + 3] = raster.data[source + 3];
    }
  }
  return { data, width, height };
}

function isPng(input: Buffer): boolean {
  return input.length >= 8 && input[0] === 0x89 && input[1] === 0x50 && input[2] === 0x4e && input[3] === 0x47;
}

function isJpeg(input: Buffer): boolean {
  return input.length >= 3 && input[0] === 0xff && input[1] === 0xd8;
}
