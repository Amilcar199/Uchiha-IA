import { describe, it } from "node:test";
import { expect } from "@/tests/helpers/expect";
import { analyzeImage } from "@/engines/vision/candle-extractor";
import { renderChart, type DrawnCandle } from "@/tests/helpers/render-chart";

function series(count: number): DrawnCandle[] {
  return Array.from({ length: count }, (_, index) => {
    const open = 10 + (index % 5) * 0.4;
    const close = open + (index % 2 === 0 ? 0.8 : -0.7);
    const high = Math.max(open, close) + 0.45;
    const low = Math.min(open, close) - 0.35;
    return { open, close, high, low };
  });
}

describe("vision engine", () => {
  it("lê um gráfico escuro e nítido", async () => {
    const image = await renderChart({ candles: series(16), theme: "dark" });
    const report = await analyzeImage(image, 15);
    expect(report.validation.accepted).toBe(true);
    expect(report.candles.length).toBeGreaterThanOrEqual(12);
    expect(report.priceScale).toBe("relative");
    expect(report.candles.every((candle) => candle.high >= candle.low)).toBe(true);
  });

  it("lê tema claro", async () => {
    const image = await renderChart({ candles: series(16), theme: "light" });
    const report = await analyzeImage(image, 15);
    expect(report.validation.accepted).toBe(true);
    expect(report.candles.length).toBeGreaterThanOrEqual(12);
  });

  it("ignora a barra lateral e ainda lê as velas", async () => {
    const image = await renderChart({ candles: series(16), sidebar: true });
    const report = await analyzeImage(image, 15);
    expect(report.validation.accepted).toBe(true);
    expect(report.candles.length).toBeGreaterThanOrEqual(12);
  });

  it("recusa resolução baixa", async () => {
    const image = await renderChart({ candles: series(8), width: 280, height: 180 });
    const report = await analyzeImage(image, 15);
    expect(report.validation.accepted).toBe(false);
    expect(report.validation.code).toBe("VISION_002");
  });

  it("marca contexto insuficiente quando há poucas velas legíveis", async () => {
    const image = await renderChart({ candles: series(8), width: 720, height: 420 });
    const report = await analyzeImage(image, 15);
    expect(report.validation.accepted).toBe(true);
    expect(report.insufficientContext).toBe(true);
  });
});
