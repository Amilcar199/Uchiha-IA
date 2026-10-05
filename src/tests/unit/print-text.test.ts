import { describe, it } from "node:test";
import { expect } from "@/tests/helpers/expect";
import { parsePrintText } from "@/engines/vision/print-text";

describe("texto do print", () => {
  it("lê CAD/JPY e 1m como no gráfico da corretora", () => {
    const context = parsePrintText("QUOTEX CAD/JPY 1m 17:26");
    expect(context.asset).toBe("CAD/JPY");
    expect(context.timeframe).toBe("M1");
    expect(context.platform).toBe("Quotex");
    expect(context.regime).toBe(null);
  });

  it("marca OTC quando a palavra está no print", () => {
    const context = parsePrintText("EUR/USD-OTC M5");
    expect(context.asset).toBe("EUR/USD");
    expect(context.timeframe).toBe("M5");
    expect(context.regime).toBe("OTC");
  });
});