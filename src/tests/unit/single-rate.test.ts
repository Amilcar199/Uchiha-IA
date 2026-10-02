import { describe, it } from "node:test";
import { expect } from "@/tests/helpers/expect";
import { classifyFormation } from "@/engines/uchiha/formations";
import { candle } from "@/tests/helpers/candles";

describe("single rate", () => {
  it("identifica compra com pavio na abertura e sem pavio no fechamento", () => {
    const formation = classifyFormation(candle(0, 10, 12, 12, 9.2));
    expect(formation?.kind).toBe("SINGLE_RATE");
    expect(formation?.direction).toBe("BUY");
    expect(formation?.level).toBe(12);
  });

  it("identifica venda com pavio na abertura e sem pavio no fechamento", () => {
    const formation = classifyFormation(candle(1, 12, 10, 12.6, 10));
    expect(formation?.kind).toBe("SINGLE_RATE");
    expect(formation?.direction).toBe("SELL");
    expect(formation?.level).toBe(10);
  });

  it("não detecta taxa única quando os dois pavios existem", () => {
    expect(classifyFormation(candle(2, 10, 12, 12.4, 9.6))).toBeNull();
  });
});
