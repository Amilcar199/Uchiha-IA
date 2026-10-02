import { describe, it } from "node:test";
import { expect } from "@/tests/helpers/expect";
import { buildDiagnosis } from "@/engines/decision/diagnosis";

describe("diagnóstico", () => {
  it("separa o que foi visto do que a teoria não consegue confirmar", () => {
    const sections = buildDiagnosis({
      asset: "EUR/USD",
      timeframe: "M1",
      regime: "REAL",
      cycle: null,
      trend: "INDEFINIDA",
      state: "AGUARDAR",
      newsStatus: "UNKNOWN",
      timingConfirmed: false,
      markings: [],
      confluences: [],
      conflicts: ["RETRACTION_VERSUS_REVERSAL"],
      missing: [],
      candleCount: 0,
      imageAccepted: false,
    });
    const text = sections.flatMap((section) => section.items.map((item) => item.text)).join(" ");
    expect(text.includes("Não foi possível confirmar")).toBe(true);
    expect(text.includes("15 segundos")).toBe(true);
    expect(text.toLowerCase().includes("probabilidade")).toBe(false);
    expect(text.toLowerCase().includes("assertividade")).toBe(false);
    expect(sections.some((section) => section.title === "Estado final")).toBe(true);
  });
});