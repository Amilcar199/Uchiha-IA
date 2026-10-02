import { describe, it } from "node:test";
import { expect } from "@/tests/helpers/expect";
import { evaluateContext } from "@/engines/supreme/supreme-engine";
import { ordinary } from "@/tests/helpers/candles";

describe("suprema", () => {
  it("não classifica ciclo sem topos e fundos suficientes", () => {
    const candles = [ordinary(0, 1, 1.2), ordinary(1, 1.2, 1.4), ordinary(2, 1.3, 1.5)];
    const context = evaluateContext(candles, 15);
    expect(context.trend).toBe("INDEFINIDA");
    expect(context.cycle).toBeNull();
    expect(context.cycleStatus).toBe("INSUFFICIENT_STRUCTURE");
    expect(context.insufficientContext).toBe(true);
  });
});
