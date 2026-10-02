import type { Candle } from "@/domain/candles/types";
import type { Direction, OperationalConcept } from "@/domain/market/types";
import type { Evidence } from "@/domain/rules/types";
import type { PriceFormation } from "@/engines/uchiha/formations";

export interface LevelInteraction {
  formation: PriceFormation;
  concept: OperationalConcept | null;
  direction: Direction | null;
  ambiguous: boolean;
  breakingCandleIndex: number | null;
  breakingCandleHasWick: boolean | null;
  closedBeyond: boolean;
  respected: boolean;
  evidence: Evidence[];
  missingConditions: string[];
}

function candleHasWick(candle: Candle): boolean {
  return candle.upperWick > 0 || candle.lowerWick > 0;
}

function closedBeyond(candle: Candle, level: number, formationDirection: Direction): boolean {
  if (formationDirection === "BUY") return candle.close < level;
  return candle.close > level;
}

function breakDirection(close: number, level: number): Direction {
  return close > level ? "BUY" : "SELL";
}

function intersects(candle: Candle, level: number): boolean {
  return candle.low <= level && candle.high >= level;
}

function rejectionTowardLevel(candle: Candle, formationDirection: Direction): boolean {
  if (formationDirection === "BUY") return candle.lowerWick > 0 && candle.close >= candle.open;
  return candle.upperWick > 0 && candle.close <= candle.open;
}

/**
 * Lê o que as velas posteriores fizeram com a marcação.
 * Fechamento além da linha = rompimento geométrico.
 * Toque com fechamento do lado do corpo = respeito.
 * Respeito sozinho não separa retração de reversão: os cenários visuais do Guia não têm regra textual que os distinga.
 */
export function readInteraction(candles: Candle[], formation: PriceFormation): LevelInteraction {
  const later = candles.filter((candle) => candle.index > formation.candleIndex);
  const evidence: Evidence[] = [
    {
      code: formation.kind,
      description:
        formation.kind === "COMMAND"
          ? `Comando de ${formation.direction === "BUY" ? "compra" : "venda"} na abertura.`
          : `Taxa única de ${formation.direction === "BUY" ? "compra" : "venda"} no fechamento.`,
      candleIndex: formation.candleIndex,
      level: formation.level,
    },
  ];

  let respectCandle: Candle | null = null;

  for (const candle of later) {
    if (!intersects(candle, formation.level) && !closedBeyond(candle, formation.level, formation.direction)) {
      continue;
    }

    if (closedBeyond(candle, formation.level, formation.direction)) {
      const hasWick = candleHasWick(candle);
      evidence.push({
        code: hasWick ? "BREAK_WITH_WICK" : "BREAK_WITHOUT_WICK",
        description: hasWick
          ? "Uma vela posterior fechou além da marcação e deixou pavio."
          : "Uma vela posterior fechou além da marcação sem deixar pavio. O Guia manda não pegar essa entrada no comando e na taxa única.",
        candleIndex: candle.index,
        level: formation.level,
      });

      return {
        formation,
        concept: hasWick ? "ROMPIMENTO" : null,
        direction: hasWick ? breakDirection(candle.close, formation.level) : null,
        ambiguous: false,
        breakingCandleIndex: candle.index,
        breakingCandleHasWick: hasWick,
        closedBeyond: true,
        respected: false,
        evidence,
        missingConditions: hasWick ? [] : ["WICK_ON_BREAKING_CANDLE"],
      };
    }

    if (intersects(candle, formation.level)) {
      respectCandle = candle;
    }
  }

  if (!respectCandle) {
    return {
      formation,
      concept: null,
      direction: null,
      ambiguous: false,
      breakingCandleIndex: null,
      breakingCandleHasWick: null,
      closedBeyond: false,
      respected: false,
      evidence,
      missingConditions: ["REACTION_TO_LEVEL"],
    };
  }

  const rejected = rejectionTowardLevel(respectCandle, formation.direction);
  evidence.push({
    code: rejected ? "REJECTION_TOUCH" : "TOUCH_WITHOUT_REJECTION",
    description: rejected
      ? "O preço voltou à marcação e fechou de volta. A geometria sozinha não separa retração de reversão."
      : "O preço tocou a marcação sem uma rejeição clara de pavio.",
    candleIndex: respectCandle.index,
    level: formation.level,
  });

  return {
    formation,
    concept: null,
    direction: null,
    ambiguous: true,
    breakingCandleIndex: respectCandle.index,
    breakingCandleHasWick: candleHasWick(respectCandle),
    closedBeyond: false,
    respected: true,
    evidence,
    missingConditions: ["RETRACTION_VERSUS_REVERSAL_UNRESOLVED"],
  };
}
