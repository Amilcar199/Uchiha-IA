import { describe, it } from "node:test";
import { expect } from "@/tests/helpers/expect";
import { classifyFormation } from "@/engines/uchiha/formations";
import { candle, ordinary } from "@/tests/helpers/candles";
import { commandCandleRule } from "@/engines/uchiha/uchiha-engine";
import { defaultRuleParameters } from "@/config/rule-parameters";

describe("command candle", () => {
  it("identifica compra quando a abertura é a mínima e ainda existe pavio no fechamento", () => {
    const formation = classifyFormation(candle(0, 10, 12, 12.4, 10));
    expect(formation?.kind).toBe("COMMAND");
    expect(formation?.direction).toBe("BUY");
    expect(formation?.level).toBe(10);
  });

  it("identifica venda quando a abertura é a máxima e ainda existe pavio no fechamento", () => {
    const formation = classifyFormation(candle(1, 12, 10, 12, 9.4));
    expect(formation?.kind).toBe("COMMAND");
    expect(formation?.direction).toBe("SELL");
    expect(formation?.level).toBe(12);
  });

  it("não detecta comando quando a abertura não é a mínima", () => {
    const bullishWithLowerWick = candle(2, 10, 12, 12.4, 9.5);
    expect(classifyFormation(bullishWithLowerWick)).toBeNull();

    const result = commandCandleRule.detect({
      candles: [ordinary(0, 10, 11), bullishWithLowerWick],
      trend: "INDEFINIDA",
      cycle: null,
      cycleStatus: "INSUFFICIENT_STRUCTURE",
      parameters: defaultRuleParameters,
      secondsElapsed: null,
      timeframe: "M1",
      marketRegime: "REAL",
    });

    expect(result.triggered).toBe(false);
  });

  it("não trata candle mágico como comando", () => {
    const magic = classifyFormation(candle(3, 10, 12, 12, 10));
    expect(magic?.kind).toBe("MAGIC_CANDLE");
  });
});
