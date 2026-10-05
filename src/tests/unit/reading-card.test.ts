import { describe, it } from "node:test";
import { expect } from "@/tests/helpers/expect";
import { buildReadingCard } from "@/engines/decision/reading-card";
import type { Marking } from "@/domain/rules/types";

function marking(partial: Partial<Marking> & Pick<Marking, "type">): Marking {
  return {
    type: partial.type,
    direction: partial.direction ?? null,
    level: partial.level ?? null,
    candleIndex: partial.candleIndex ?? null,
    confidence: partial.confidence ?? 1,
    metadata: partial.metadata ?? {},
  };
}

describe("cartão de leitura", () => {
  it("mostra compra com a marcação do livro e sem percentual de acerto", () => {
    const card = buildReadingCard({
      state: "OPERAR_COMPRA",
      confidence: "alta",
      cycle: "CORRECAO_EM_TENDENCIA",
      trend: "ALTA",
      markings: [
        marking({ type: "COMMAND", direction: "BUY", level: 1.25, candleIndex: 4 }),
        marking({ type: "LIQUIDITY_TARGET", direction: "BUY", level: 1.4, candleIndex: 6 }),
      ],
      confluences: [{ evidence: "O ciclo admite a marcação." }],
      missing: [],
      conflicts: [],
    });
    expect(card.headline).toBe("COMPRA");
    expect(card.marking).toBe("Comando");
    expect(card.level).toBe("1.2500");
    expect(card.target.includes("Alvo de liquidez")).toBe(true);
    expect(card.defense).toBe("Não confirmada neste print");
    expect(card.confidence.includes("%")).toBe(false);
  });

  it("traduz a falta de espaço para uma frase, sem inventar o número", () => {
    const card = buildReadingCard({
      state: "AGUARDAR",
      confidence: "media",
      cycle: null,
      trend: "INDEFINIDA",
      markings: [],
      confluences: [],
      missing: ["SPACE_TO_NEXT_DEFENSE"],
      conflicts: [],
    });
    expect(card.headline).toBe("AGUARDAR");
    expect(card.pending.includes("Espaço até a próxima defesa")).toBe(true);
    expect(card.marking).toBe("Nenhuma marcação operacional confirmada");
  });
});
