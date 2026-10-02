import { describe, it } from "node:test";
import { expect } from "@/tests/helpers/expect";
import { evaluateDecision, type DecisionInput } from "@/engines/decision/decision-engine";

function base(overrides: Partial<DecisionInput> = {}): DecisionInput {
  return {
    imageAccepted: true,
    imageBlockers: [],
    metadataComplete: true,
    metadataMissing: [],
    newsBlocks: false,
    newsCaution: false,
    newsMissing: [],
    contextOperable: true,
    contextMissing: [],
    insufficientContext: false,
    confluences: [
      {
        type: "FAVORABLE_CYCLE",
        direction: "BUY",
        weight: 1,
        evidence: "ciclo",
        ruleId: "SUPREMA_CYCLE",
        family: "cycle",
      },
      {
        type: "TREND_ALIGNMENT",
        direction: "BUY",
        weight: 1,
        evidence: "tendência",
        ruleId: "SUPREMA_TREND",
        family: "trend",
      },
      {
        type: "VALID_MARKING",
        direction: "BUY",
        weight: 1,
        evidence: "marcação",
        ruleId: "COMMAND_CANDLE",
        family: "marking",
      },
    ],
    independentCount: 3,
    favoredDirection: "BUY",
    conflicts: [],
    triggerConfirmed: true,
    triggerMissing: [],
    spaceStatus: "ENOUGH",
    spaceMissing: [],
    readingScore: 0.86,
    ...overrides,
  };
}

describe("decision engine", () => {
  it("menos de 3 confluências leva a aguardar", () => {
    const decision = evaluateDecision(base({ independentCount: 2, confluences: base().confluences.slice(0, 2) }));
    expect(decision.state).toBe("AGUARDAR");
    expect(decision.missingConditions).toContain("MINIMUM_CONFLUENCES");
  });

  it("notícia bloqueada no mercado real leva a não operar", () => {
    const decision = evaluateDecision(base({ newsBlocks: true }));
    expect(decision.state).toBe("NAO_OPERAR");
    expect(decision.blockers).toContain("NEWS_BLOCKED");
  });

  it("imagem ruim leva a não operar", () => {
    const decision = evaluateDecision(
      base({ imageAccepted: false, imageBlockers: ["INSUFFICIENT_VISUAL_EVIDENCE"] }),
    );
    expect(decision.state).toBe("NAO_OPERAR");
  });

  it("sinais contraditórios levam a aguardar", () => {
    const decision = evaluateDecision(base({ conflicts: ["OPPOSITE_DIRECTIONS"] }));
    expect(decision.state).toBe("AGUARDAR");
  });

  it("três confluências, gatilho e espaço produzem compra", () => {
    const decision = evaluateDecision(base());
    expect(decision.state).toBe("OPERAR_COMPRA");
    expect(decision.confidence).not.toMatch(/%/);
    expect(decision.explanation.toLowerCase()).not.toContain("chance");
  });

  it("gatilho ausente leva a aguardar", () => {
    const decision = evaluateDecision(base({ triggerConfirmed: false, triggerMissing: ["SECONDS_ELAPSED"] }));
    expect(decision.state).toBe("AGUARDAR");
    expect(decision.missingConditions).toContain("TRIGGER");
  });

  it("espaço sem parâmetro validado não vira operação", () => {
    const decision = evaluateDecision(
      base({ spaceStatus: "UNCONFIGURED", spaceMissing: ["SPACE_PARAMETER_PENDING_MENTOR_VALIDATION"] }),
    );
    expect(decision.state).toBe("AGUARDAR");
    expect(decision.missingConditions).toContain("SPACE_TO_NEXT_DEFENSE");
  });
});
