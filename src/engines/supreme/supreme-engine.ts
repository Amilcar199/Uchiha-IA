import type { Candle } from "@/domain/candles/types";
import type { Cycle, CycleStatus, OperationalConcept, Trend } from "@/domain/market/types";
import { detectSwings, swingHighs, swingLows } from "@/engines/supreme/swings";
import type { SwingPoint } from "@/domain/rules/types";

export interface MarketContext {
  trend: Trend;
  cycle: Cycle | null;
  cycleStatus: CycleStatus;
  swings: SwingPoint[];
  allowedConcepts: OperationalConcept[];
  insufficientContext: boolean;
  notes: string[];
  source: {
    document: string;
    section: string;
  };
}

function lastTwoAscending(points: SwingPoint[]): boolean | null {
  if (points.length < 2) return null;
  const previous = points[points.length - 2].price;
  const current = points[points.length - 1].price;
  return current > previous;
}

/**
 * Classifica tendência por topos e fundos.
 * Alta = topos e fundos ascendentes. Baixa = topos e fundos descendentes.
 * Fonte: Manual, fundamento 2; Guia, ciclos.
 * Não usa limiar inventado de "agressivo" para forçar o ciclo tendencial.
 */
export function evaluateContext(
  candles: Candle[],
  minimumForContext: number,
  tendentialConsecutiveCandles: number | null = null,
): MarketContext {
  const swings = detectSwings(candles);
  const highs = swingHighs(swings);
  const lows = swingLows(swings);
  const notes: string[] = [];
  const insufficientContext = candles.length < minimumForContext;

  if (insufficientContext) {
    notes.push("A série tem menos velas do que o contexto de ciclo pede (15–20).");
  }

  const highsUp = lastTwoAscending(highs);
  const lowsUp = lastTwoAscending(lows);

  let trend: Trend = "INDEFINIDA";
  if (highsUp === true && lowsUp === true) trend = "ALTA";
  else if (highsUp === false && lowsUp === false) trend = "BAIXA";
  else if (highs.length >= 2 && lows.length >= 2) trend = "LATERAL";

  let cycle: Cycle | null = null;
  let cycleStatus: CycleStatus = "INSUFFICIENT_STRUCTURE";
  let allowedConcepts: OperationalConcept[] = [];

  const trailing = trailingSameColor(candles);
  const tendential =
    tendentialConsecutiveCandles != null &&
    trailing >= tendentialConsecutiveCandles &&
    (trend === "ALTA" || trend === "BAIXA");

  if (tendential) {
    cycle = "TENDENCIA";
    cycleStatus = "CLASSIFIED";
    allowedConcepts = ["ROMPIMENTO", "CONTINUACAO"];
    notes.push(
      "A sequência final atingiu o número configurado de velas na mesma direção. Ciclo tendencial: só rompimento e continuação.",
    );
  } else if (trend === "ALTA" || trend === "BAIXA") {
    cycle = "CORRECAO_EM_TENDENCIA";
    cycleStatus = "CLASSIFIED";
    allowedConcepts = ["RETRACAO", "REVERSAO", "ROMPIMENTO", "CONTINUACAO"];
    notes.push(
      "Topos e fundos seguem a mesma direção, com correção que não desfaz a estrutura. Ciclo classificado como correção em tendência.",
    );
  } else if (trend === "LATERAL") {
    cycle = "CORRECAO_LATERAL";
    cycleStatus = "CLASSIFIED";
    allowedConcepts = ["RETRACAO", "REVERSAO"];
    notes.push(
      "Há topos e fundos sem direção única. Ciclo classificado como correção lateral. Rompimento de continuação não é o operacional deste ciclo.",
    );
  } else {
    notes.push(
      "Sem dois topos e dois fundos comparáveis, a tendência fica indefinida. O ciclo tendencial não é forçado: o material descreve movimento agressivo sem limiar numérico validado.",
    );
  }

  notes.push(
    "O ciclo consolidado não é atribuído automaticamente. O Guia o trata como operável e, ao mesmo tempo, lista gráficos de consolidação entre os que não operar.",
  );

  return {
    trend,
    cycle,
    cycleStatus,
    swings,
    allowedConcepts,
    insufficientContext,
    notes,
    source: {
      document: "Guia de Estudos sobre a Lógica do Preço",
      section: "Ciclos do mercado",
    },
  };
}

export function conceptAllowed(context: MarketContext, concept: OperationalConcept): boolean {
  return context.allowedConcepts.includes(concept);
}

function trailingSameColor(candles: Candle[]): number {
  const last = candles[candles.length - 1];
  if (!last || last.color === "neutral") return 0;
  let count = 0;
  for (let index = candles.length - 1; index >= 0; index -= 1) {
    if (candles[index].color !== last.color) break;
    count += 1;
  }
  return count;
}
