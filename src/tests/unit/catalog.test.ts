import { describe, it } from "node:test";
import { expect } from "@/tests/helpers/expect";
import { defaultRuleParameters } from "@/config/rule-parameters";
import { detectClassics } from "@/engines/classic/lorenz";
import { evaluateScalp5s } from "@/engines/profile-5s/profile";
import { evaluateContext } from "@/engines/supreme/supreme-engine";
import { connectionFailures, detectCatalog, type Run } from "@/engines/uchiha/catalog";
import { candle, ordinary } from "@/tests/helpers/candles";

function types(candles: ReturnType<typeof candle>[]) {
  return detectCatalog(candles, true).markings.map((item) => item.type);
}

describe("catálogo da lógica do preço", () => {
  it("forma taxa dividida só quando a taxa única vem antes do comando", () => {
    const divided = [
      candle(0, 10, 12, 12, 9),
      candle(1, 12, 13, 13.5, 12),
    ];
    const inverse = [
      candle(0, 10, 12, 12.4, 10),
      candle(1, 12.2, 13, 13, 11.4),
    ];
    const found = detectCatalog(divided, true).markings.find((item) => item.type === "DIVIDED_RATE");
    expect(found?.level).toBe(12);
    expect(types(inverse).includes("DIVIDED_RATE")).toBe(false);
  });

  it("marca nova alta quando o corpo supera o pavio anterior e deixa novo pavio", () => {
    const candles = [ordinary(0, 10, 11), candle(1, 11.2, 12.2, 12.6, 11.1)];
    const high = detectCatalog(candles, true).markings.find((item) => item.type === "NEW_HIGH");
    expect(high?.direction).toBe("BUY");
    expect(high?.level).toBe(12.6);
  });

  it("marca dupla posição quando a segunda não supera o pavio da primeira", () => {
    const candles = [candle(0, 10, 12, 13, 9.5), candle(1, 12.1, 12.4, 12.8, 11.8)];
    expect(types(candles)).toContain("DOUBLE_POSITION");
  });

  it("descarta o primeiro registro no quarto rompimento", () => {
    const candles = [
      candle(0, 10, 11, 11.2, 8),
      candle(1, 11, 12.2, 12.4, 10.8),
      candle(2, 12, 13, 13.2, 11.6),
      candle(3, 13, 14, 14.2, 12.6),
      candle(4, 14, 15, 15.2, 13.6),
    ];
    const record = detectCatalog(candles, true).markings.find(
      (item) => item.type === "FIRST_RECORD" && item.direction === "BUY",
    );
    expect(record?.metadata.discarded).toBe(true);
    expect(record?.metadata.breaks).toBe(4);
  });

  it("reprova cada regra da conexão de lotes isoladamente", () => {
    const run: Run = {
      start: 0,
      end: 1,
      color: "bullish",
      candles: [candle(0, 10, 12, 12.2, 9.8), candle(1, 12, 13, 13.2, 11.8)],
      high: 13.2,
      low: 9.8,
      bodyHigh: 13,
      bodyLow: 10,
    };
    const previous = candle(1, 12, 13, 13.2, 11.8);
    expect(connectionFailures(run, candle(2, 13.1, 14, 14.4, 13), previous, [])).toContain("fecha fora do pavio");
    expect(connectionFailures(run, candle(2, 13.05, 13.1, 13.4, 12.9), previous, [])).toContain("fecha dentro do pavio");
    expect(connectionFailures(run, candle(2, 9.9, 9.9, 10.2, 9.7), previous, [])).toContain("não fecha dentro do corpo");
    const locked = connectionFailures(
      run,
      candle(2, 11, 11.5, 12.2, 10.6),
      previous,
      [
        {
          type: "POSITIONING",
          direction: "BUY",
          level: 11,
          zoneLow: 10.5,
          zoneHigh: 12,
          candleIndex: 0,
          confidence: 1,
          metadata: {},
        },
      ],
    );
    expect(locked).toContain("trava em posicionamento");
    expect(connectionFailures(run, candle(2, 12.2, 12.5, 12.5, 12), previous, [])).toContain(
      "não deixa nova alta nem nova baixa",
    );
  });

  it("reconhece preço fechado e não o confunde com um comando que ainda tem pavio no fechamento", () => {
    const closed = candle(0, 10, 12, 12, 9.5);
    const command = candle(1, 10, 12, 12.4, 10);
    const names = types([closed, command]);
    expect(names.includes("CLOSED_PRICE")).toBe(true);
    const closedMark = detectCatalog([closed, command], true).markings.filter((item) => item.type === "CLOSED_PRICE");
    expect(closedMark.map((item) => item.candleIndex).includes(0)).toBe(true);
    expect(closedMark.map((item) => item.candleIndex).includes(1)).toBe(false);
  });
});

describe("Lorenz e perfis", () => {
  it("reconhece o martelo depois de uma queda", () => {
    const candles = [ordinary(0, 12, 10), candle(1, 10, 11, 11, 7)];
    const hammer = detectClassics(candles, defaultRuleParameters).find((item) => item.metadata.name === "martelo");
    expect(hammer?.candleIndex).toBe(1);
  });

  it("mantém o perfil 5s desligado e bloqueia sequência longa quando ligado", () => {
    const candles = [1, 2, 3, 4, 5, 6].map((close, index) => ordinary(index, close, close + 0.4));
    expect(evaluateScalp5s({ enabled: false, candles, secondsElapsed: 30, timeframe: "M1" }).blocked).toBe(false);
    const blocked = evaluateScalp5s({ enabled: true, candles, secondsElapsed: 30, timeframe: "M1" });
    expect(blocked.blocked).toBe(true);
  });

  it("só classifica ciclo tendencial quando o número de velas é configurado", () => {
    const candles = [
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
      ordinary(20, 12.0, 12.6),
      ordinary(21, 12.4, 13.0),
    ];
    expect(evaluateContext(candles, 2).cycle === "TENDENCIA").toBe(false);
    const tendential = evaluateContext(candles, 2, 3);
    expect(tendential.cycle).toBe("TENDENCIA");
    expect(tendential.allowedConcepts.includes("REVERSAO")).toBe(false);
  });
});
