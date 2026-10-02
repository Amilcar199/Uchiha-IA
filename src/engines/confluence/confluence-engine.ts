import type { Direction } from "@/domain/market/types";
import type { Confluence, DetectedSetup, Marking } from "@/domain/rules/types";
import type { MarketContext } from "@/engines/supreme/supreme-engine";
import type { TimingResult } from "@/engines/sharingan/sharingan-engine";
import { conceptAllowed } from "@/engines/supreme/supreme-engine";

export interface ConfluenceReport {
  items: Confluence[];
  independentCount: number;
  conflicts: string[];
  favoredDirection: Direction | null;
}

/**
 * Conta famílias independentes.
 * Comando, comando respeitado e comando confirmado não viram três confluências.
 */
export function evaluateConfluences(input: {
  context: MarketContext;
  setups: DetectedSetup[];
  timing: TimingResult | null;
  markings?: Marking[];
  focusIndex?: number | null;
}): ConfluenceReport {
  const conflicts = new Set<string>();
  for (const setup of input.setups) {
    for (const conflict of setup.conflicts) conflicts.add(conflict.code);
  }

  const directions = new Set(input.setups.map((setup) => setup.direction));
  if (directions.size > 1) conflicts.add("OPPOSITE_DIRECTIONS");

  const unambiguous = input.setups.filter((setup) => setup.conflicts.length === 0 && setup.concept);
  const favored = pickDirection(unambiguous);
  if (!favored) {
    return {
      items: [],
      independentCount: 0,
      conflicts: [...conflicts],
      favoredDirection: null,
    };
  }

  const setup = unambiguous.find((item) => item.direction === favored);
  if (!setup) {
    return { items: [], independentCount: 0, conflicts: [...conflicts], favoredDirection: null };
  }

  const items: Confluence[] = [];

  if (input.context.cycle && conceptAllowed(input.context, setup.concept)) {
    items.push({
      type: "FAVORABLE_CYCLE",
      direction: favored,
      weight: 1,
      evidence: `O ciclo ${input.context.cycle} permite ${setup.concept}.`,
      ruleId: "SUPREMA_CYCLE",
      family: "cycle",
    });
  }

  const trendMatches =
    (favored === "BUY" && input.context.trend === "ALTA") ||
    (favored === "SELL" && input.context.trend === "BAIXA");
  if (trendMatches) {
    items.push({
      type: "TREND_ALIGNMENT",
      direction: favored,
      weight: 1,
      evidence: `A tendência ${input.context.trend} está alinhada com a direção lida.`,
      ruleId: "SUPREMA_TREND",
      family: "trend",
    });
  }

  items.push({
    type: "VALID_MARKING",
    direction: favored,
    weight: 1,
    evidence: setup.evidence.map((item) => item.description).join(" "),
    ruleId: setup.ruleId,
    family: "marking",
  });

  if (input.timing?.confirmed) {
    items.push({
      type: "TIMING_TRIGGER",
      direction: favored,
      weight: 1,
      evidence: "A reação está na vela atual e dentro da janela de 15 segundos informada.",
      ruleId: "SHARINGAN_TIMING",
      family: "timing",
    });
  }

  agreeWithFocus(items, input.markings ?? [], input.focusIndex ?? null, favored);

  const families = new Set(items.map((item) => item.family));

  return {
    items,
    independentCount: families.size,
    conflicts: [...conflicts],
    favoredDirection: favored,
  };
}

function agreeWithFocus(items: Confluence[], markings: Marking[], focusIndex: number | null, favored: Direction) {
  if (focusIndex == null) return;
  const recent = markings.filter((item) => item.candleIndex != null && item.candleIndex >= focusIndex - 1);
  const agrees = (item: Marking) => item.direction === favored && item.metadata.discarded !== true;

  if (recent.some((item) => agrees(item) && (item.type === "NEW_HIGH" || item.type === "NEW_LOW"))) {
    items.push(familyItem(favored, "new_extreme", "NEW_EXTREME", "Nova alta ou nova baixa a favor da leitura."));
  }
  if (recent.some((item) => agrees(item) && (item.type === "LIQUIDITY_TARGET" || item.type === "CONNECTION_TARGET" || item.type === "LOT_CONNECTION"))) {
    items.push(familyItem(favored, "target", "OPEN_TARGET", "Há alvo ou conexão de lote ainda utilizável na direção lida."));
  }
  if (recent.some((item) => item.type === "CLASSIC" && (item.direction === favored || item.direction === null))) {
    items.push(familyItem(favored, "classic", "LORENZ", "Um candle clássico acompanha a leitura. Sozinho não autoriza entrada."));
  }
}

function familyItem(direction: Direction, family: string, ruleId: string, evidence: string): Confluence {
  return { type: family, direction, weight: 1, evidence, ruleId, family };
}

function pickDirection(setups: DetectedSetup[]): Direction | null {
  const buys = setups.filter((setup) => setup.direction === "BUY");
  const sells = setups.filter((setup) => setup.direction === "SELL");
  if (buys.length > 0 && sells.length > 0) return null;
  if (buys.length > 0) return "BUY";
  if (sells.length > 0) return "SELL";
  return null;
}
