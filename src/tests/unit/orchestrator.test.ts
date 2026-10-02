import { describe, it } from "node:test";
import { expect } from "@/tests/helpers/expect";
import { defaultRuleParameters, type RuleParameters } from "@/config/rule-parameters";
import { runAnalysis } from "@/engines/orchestrator/analysis-orchestrator";
import type { Candle } from "@/domain/candles/types";
import { candle, ordinary } from "@/tests/helpers/candles";

function uptrendWithBuyBreak(): Candle[] {
  const candles: Candle[] = [
    ordinary(0, 7.2, 7.8),
    ordinary(1, 7.6, 8.4),
    ordinary(2, 8.2, 8.8),
    ordinary(3, 8.5, 9.2),
    ordinary(4, 8.8, 10.2),
    ordinary(5, 9.6, 9.1),
    ordinary(6, 9.2, 8.4),
    ordinary(7, 8.5, 7.6),
    ordinary(8, 7.8, 7.1),
    ordinary(9, 7.4, 8.2),
    ordinary(10, 8.0, 8.8),
    ordinary(11, 8.6, 9.5),
    ordinary(12, 9.2, 13.2),
    ordinary(13, 12.4, 11.6),
    ordinary(14, 11.8, 11.0),
    ordinary(15, 11.2, 10.4),
    ordinary(16, 10.6, 9.6),
    ordinary(17, 9.8, 10.6),
    candle(18, 11.2, 10.6, 11.2, 10.2),
    candle(19, 11.15, 12.05, 12.3, 11.0),
  ];
  return candles;
}

const configured: RuleParameters = {
  ...defaultRuleParameters,
  defenseDistanceRatio: 0.05,
};

describe("orchestrator", () => {
  it("compra quando rompimento, contexto, gatilho e espaço configurado se alinham", async () => {
    const result = await runAnalysis({
      candles: uptrendWithBuyBreak(),
      parameters: configured,
      metadata: {
        asset: "EUR/USD",
        marketRegime: "REAL",
        timeframe: "M1",
        platform: "quotex",
        secondsElapsed: 8,
        newsDeclaration: "FREE",
      },
    });

    expect(result.context.trend).toBe("ALTA");
    expect(result.context.cycle).toBe("CORRECAO_EM_TENDENCIA");
    expect(result.decision.state).toBe("OPERAR_COMPRA");
    expect(result.independentCount).toBeGreaterThanOrEqual(3);
    expect(result.explanation[0]).toContain("OPERAR COMPRA");
  });

  it("sem o parâmetro de espaço a mesma leitura fica em aguardar", async () => {
    const result = await runAnalysis({
      candles: uptrendWithBuyBreak(),
      metadata: {
        asset: "EUR/USD",
        marketRegime: "REAL",
        timeframe: "M1",
        secondsElapsed: 8,
        newsDeclaration: "FREE",
      },
    });

    expect(result.decision.state).toBe("AGUARDAR");
    expect(result.decision.missingConditions).toContain("SPACE_TO_NEXT_DEFENSE");
  });
});
