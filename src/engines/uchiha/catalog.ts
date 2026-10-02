import type { Candle } from "@/domain/candles/types";
import type { Direction } from "@/domain/market/types";
import type { DetectedSetup, Marking } from "@/domain/rules/types";
import { classifyFormation, type PriceFormation } from "@/engines/uchiha/formations";

const EPS = 1e-9;

export interface CatalogResult {
  markings: Marking[];
  setups: DetectedSetup[];
}

export interface Run {
  start: number;
  end: number;
  color: "bullish" | "bearish";
  candles: Candle[];
  high: number;
  low: number;
  bodyHigh: number;
  bodyLow: number;
}

/**
 * Marcações da Lógica do Preço que a fase 1 ainda não operava.
 * Só entra o que se lê pelo corpo e pelo pavio. Pavio longo, perto e espaço continuam sem número.
 */
export function detectCatalog(candles: Candle[], hasLaterOperationalSetup: boolean): CatalogResult {
  const markings: Marking[] = [];
  const runs = colorRuns(candles);
  const lots = runs.map(toLot);
  markings.push(...lots);

  const divided = dividedRates(candles);
  markings.push(...divided.markings);

  markings.push(...newPositions(candles, runs));
  markings.push(...firstRecords(candles, runs));
  markings.push(...newExtremes(candles));
  const doubles = doublePositions(candles);
  const triples = triplePositions(candles);
  markings.push(...doubles, ...triples);
  const positions = positionings(candles);
  markings.push(...positions);
  markings.push(...domains(candles, positions));
  markings.push(...lotConnections(candles, runs, positions));
  markings.push(...exhaustion(candles, doubles, triples));
  markings.push(...closedPrices(candles));
  markings.push(...forceCandles(candles, positions));
  markings.push(...targets(candles, runs, positions));

  return {
    markings,
    setups: hasLaterOperationalSetup ? [] : divided.setups,
  };
}

function bodyTop(candle: Candle): number {
  return Math.max(candle.open, candle.close);
}

function bodyBottom(candle: Candle): number {
  return Math.min(candle.open, candle.close);
}

function colorRuns(candles: Candle[]): Run[] {
  const runs: Run[] = [];
  for (const candle of candles) {
    if (candle.color === "neutral") continue;
    const last = runs[runs.length - 1];
    const adjacent = last != null && candle.index === last.end + 1 && last.color === candle.color;
    if (adjacent && last) {
      last.end = candle.index;
      last.candles.push(candle);
      last.high = Math.max(last.high, candle.high);
      last.low = Math.min(last.low, candle.low);
      last.bodyHigh = Math.max(last.bodyHigh, bodyTop(candle));
      last.bodyLow = Math.min(last.bodyLow, bodyBottom(candle));
      continue;
    }
    runs.push({
      start: candle.index,
      end: candle.index,
      color: candle.color,
      candles: [candle],
      high: candle.high,
      low: candle.low,
      bodyHigh: bodyTop(candle),
      bodyLow: bodyBottom(candle),
    });
  }
  return runs;
}

function toLot(run: Run, index: number, runs: Run[]): Marking {
  const nano = run.candles.length === 1 && index > 0;
  return marking({
    type: "LOT",
    direction: run.color === "bullish" ? "BUY" : "SELL",
    level: run.color === "bullish" ? run.high : run.low,
    zoneLow: run.low,
    zoneHigh: run.high,
    candleIndex: run.start,
    metadata: {
      kind: nano ? "nano" : run.candles.length >= 2 ? "micro" : "abertura",
      end: run.end,
      source: "Guia, lotes",
    },
  });
}

function dividedRates(candles: Candle[]): { markings: Marking[]; setups: DetectedSetup[] } {
  const markings: Marking[] = [];
  const setups: DetectedSetup[] = [];
  const formations = candles
    .map((candle) => classifyFormation(candle))
    .filter((item): item is PriceFormation => item != null);

  for (let index = 0; index < formations.length - 1; index += 1) {
    const current = formations[index];
    const next = formations[index + 1];
    if (current.kind !== "SINGLE_RATE" || next.kind !== "COMMAND") continue;
    if (next.candleIndex !== current.candleIndex + 1) continue;
    const level = (current.candle.close + next.candle.open) / 2;
    markings.push(
      marking({
        type: "DIVIDED_RATE",
        direction: next.direction,
        level,
        candleIndex: next.candleIndex,
        metadata: {
          singleRateIndex: current.candleIndex,
          commandIndex: next.candleIndex,
          source: "Guia, taxa dividida. A ordem inversa não forma o padrão.",
        },
      }),
    );
    const setup = levelSetup(candles, {
      ruleId: "DIVIDED_RATE",
      direction: next.direction,
      candleIndex: next.candleIndex,
      level,
      label: "Taxa dividida no meio entre o fechamento da taxa única e a abertura do comando.",
    });
    if (setup) setups.push(setup);
  }
  return { markings, setups: setups.slice(-1) };
}

function newPositions(candles: Candle[], runs: Run[]): Marking[] {
  const found: Marking[] = [];
  for (const candle of candles) {
    const formation = classifyFormation(candle);
    if (formation?.kind !== "COMMAND") continue;
    const next = candles.find((item) => item.index === candle.index + 1);
    if (!next) continue;
    const zone = wickZone(next, formation.direction === "BUY" ? "up" : "down");
    if (!zone) continue;
    found.push(
      marking({
        type: "NEW_POSITION",
        direction: formation.direction,
        level: zone.level,
        zoneLow: zone.low,
        zoneHigh: zone.high,
        candleIndex: next.index,
        metadata: { kind: "tipo_2", commandIndex: candle.index, source: "Guia, nova posição" },
      }),
    );
  }

  for (const run of runs) {
    if (run.candles.length < 2) continue;
    const breakUp = candles.find((candle) => candle.index > run.end && candle.close > run.high);
    const breakDown = candles.find((candle) => candle.index > run.end && candle.close < run.low);
    const broken = earlier(breakUp, breakDown);
    if (!broken) continue;
    const follow = candles.find((candle) => candle.index === broken.candle.index + 1);
    if (!follow) continue;
    const side = broken.side === "up" ? "up" : "down";
    const zone = wickZone(follow, side);
    if (!zone) continue;
    found.push(
      marking({
        type: "NEW_POSITION",
        direction: side === "up" ? "BUY" : "SELL",
        level: zone.level,
        zoneLow: zone.low,
        zoneHigh: zone.high,
        candleIndex: follow.index,
        metadata: { kind: "tipo_1", lotStart: run.start, source: "Guia, nova posição" },
      }),
    );
  }
  return found;
}

function firstRecords(candles: Candle[], runs: Run[]): Marking[] {
  const found: Marking[] = [];
  for (const run of runs) {
    const first = run.candles[0];
    found.push(...wickRecords(candles, first, "primeira vela do lote"));
    for (const candle of run.candles) {
      const formation = classifyFormation(candle);
      if (formation?.kind === "COMMAND") found.push(...wickRecords(candles, candle, "comando dentro do lote"));
    }
  }
  for (const candle of candles) {
    const formation = classifyFormation(candle);
    if (formation?.kind !== "SINGLE_RATE") continue;
    const second = candles.find((item) => item.index === candle.index + 2);
    if (second) found.push(...wickRecords(candles, second, "segunda vela após a taxa única"));
  }
  return found;
}

function wickRecords(candles: Candle[], candle: Candle, origin: string): Marking[] {
  const records: Marking[] = [];
  if (candle.upperWick > EPS) {
    records.push(recordAt(candles, candle, candle.high, "BUY", origin));
  }
  if (candle.lowerWick > EPS) {
    records.push(recordAt(candles, candle, candle.low, "SELL", origin));
  }
  return records;
}

function recordAt(candles: Candle[], candle: Candle, level: number, direction: Direction, origin: string): Marking {
  const side = direction === "BUY" ? "up" : "down";
  const breaks = candles.filter((item) => item.index > candle.index && closedBeyond(item, level, side));
  const wickless = breaks.filter((item) => item.upperWick <= EPS && item.lowerWick <= EPS).length;
  const discarded = breaks.length >= 4;
  return marking({
    type: "FIRST_RECORD",
    direction,
    level,
    candleIndex: candle.index,
    metadata: {
      origin,
      breaks: breaks.length,
      wicklessBreaks: wickless,
      discarded,
      source: "Guia, primeiro registro. Vale no máximo até 3 rompimentos, cada um com pavio.",
    },
  });
}

function newExtremes(candles: Candle[]): Marking[] {
  const found: Marking[] = [];
  for (let index = 1; index < candles.length; index += 1) {
    const previous = candles[index - 1];
    const current = candles[index];
    if (current.color === "bullish" && current.close > previous.high && current.upperWick > EPS) {
      found.push(
        marking({
          type: "NEW_HIGH",
          direction: "BUY",
          level: current.high,
          candleIndex: current.index,
          metadata: { source: "Guia, nova alta. O corpo supera o pavio anterior e deixa novo pavio." },
        }),
      );
    }
    if (current.color === "bearish" && current.close < previous.low && current.lowerWick > EPS) {
      found.push(
        marking({
          type: "NEW_LOW",
          direction: "SELL",
          level: current.low,
          candleIndex: current.index,
          metadata: { source: "Guia, nova baixa. O corpo supera o pavio anterior e deixa novo pavio." },
        }),
      );
    }
  }
  return found;
}

function doublePositions(candles: Candle[]): Marking[] {
  const found: Marking[] = [];
  for (let index = 0; index < candles.length - 1; index += 1) {
    const first = candles[index];
    const second = candles[index + 1];
    if (first.color === "neutral" || first.color !== second.color) continue;
    const exceeded =
      first.color === "bullish" ? second.close > first.high : second.close < first.low;
    if (exceeded) continue;
    found.push(
      marking({
        type: "DOUBLE_POSITION",
        direction: first.color === "bullish" ? "BUY" : "SELL",
        level: (first.close + second.open) / 2,
        candleIndex: second.index,
        metadata: {
          previousIndex: first.index,
          source: "Guia, dupla posição. A segunda não supera com o corpo o pavio da anterior.",
        },
      }),
    );
  }
  return found;
}

function triplePositions(candles: Candle[]): Marking[] {
  const found: Marking[] = [];
  for (let index = 0; index < candles.length - 2; index += 1) {
    const first = candles[index];
    const second = candles[index + 1];
    const third = candles[index + 2];
    if (first.color === "neutral" || first.color !== second.color || second.color !== third.color) continue;
    const secondInside = first.color === "bullish" ? second.close <= first.high : second.close >= first.low;
    const thirdInside = first.color === "bullish" ? third.close <= first.high : third.close >= first.low;
    if (!secondInside || !thirdInside) continue;
    found.push(
      marking({
        type: "TRIPLE_POSITION",
        direction: first.color === "bullish" ? "BUY" : "SELL",
        level: second.open,
        zoneLow: Math.min(second.open, second.close),
        zoneHigh: Math.max(second.open, second.close),
        candleIndex: second.index,
        metadata: { thirdIndex: third.index, source: "Guia, tripla posição. Linhas na abertura e no fechamento da segunda." },
      }),
    );
  }
  return found;
}

function positionings(candles: Candle[]): Marking[] {
  const found: Marking[] = [];
  for (let index = 1; index < candles.length; index += 1) {
    const previous = candles[index - 1];
    const current = candles[index];
    if (previous.color === "neutral" || current.color === "neutral" || previous.color === current.color) continue;
    const next = candles[index + 1];
    const confirmed = next != null && next.color === current.color;
    const buy = current.color === "bullish";
    found.push(
      marking({
        type: "POSITIONING",
        direction: buy ? "BUY" : "SELL",
        level: buy ? current.low : current.high,
        zoneLow: current.low,
        zoneHigh: current.high,
        candleIndex: current.index,
        metadata: {
          recommended: confirmed,
          source: confirmed
            ? "Guia, posicionamento. Mudança de cor com pelo menos duas velas."
            : "Posicionamento de uma vela. O material não o recomenda.",
        },
      }),
    );
  }
  return found;
}

function domains(candles: Candle[], positions: Marking[]): Marking[] {
  const found: Marking[] = [];
  for (const position of positions) {
    if (position.candleIndex == null || position.level == null || position.direction == null) continue;
    const host = candles.find((candle) => candle.index === position.candleIndex);
    if (!host) continue;
    const later = candles.filter((candle) => candle.index > host.index);
    const accepted = later.find((candle) =>
      position.direction === "BUY" ? candle.close > host.high : candle.close < host.low,
    );
    if (!accepted) continue;
    found.push(
      marking({
        type: "DOMAIN",
        direction: position.direction,
        level: position.direction === "BUY" ? host.high : host.low,
        candleIndex: accepted.index,
        metadata: {
          positioningIndex: host.index,
          source: "Guia, domínio. O fechamento ficou fora dos pavios da região contrária.",
        },
      }),
    );
  }
  return found;
}

function lotConnections(candles: Candle[], runs: Run[], positions: Marking[]): Marking[] {
  const found: Marking[] = [];
  for (const run of runs) {
    if (run.candles.length < 2) continue;
    const candidate = candles.find((candle) => candle.index > run.end);
    const previous = candles.find((candle) => candle.index === (candidate?.index ?? 0) - 1);
    if (!candidate || !previous) continue;
    const failures = connectionFailures(run, candidate, previous, positions);
    if (failures.length > 0) continue;
    found.push(
      marking({
        type: "LOT_CONNECTION",
        direction: run.color === "bullish" ? "BUY" : "SELL",
        level: candidate.close,
        candleIndex: candidate.index,
        metadata: { lotStart: run.start, source: "Guia, conexão de lotes. As cinco regras passaram." },
      }),
    );
  }
  return found;
}

export function connectionFailures(
  run: Run,
  candidate: Candle,
  previous: Candle,
  positions: Marking[],
): string[] {
  const failures: string[] = [];
  if (candidate.close > run.high || candidate.close < run.low) failures.push("fecha fora do pavio");
  const insideUpperWick = candidate.close > run.bodyHigh && candidate.close < run.high;
  const insideLowerWick = candidate.close < run.bodyLow && candidate.close > run.low;
  if (insideUpperWick || insideLowerWick) failures.push("fecha dentro do pavio");
  const insideBody = run.candles.some((candle) => {
    const top = bodyTop(candle);
    const bottom = bodyBottom(candle);
    return candidate.close <= top + EPS && candidate.close >= bottom - EPS;
  });
  if (!insideBody) failures.push("não fecha dentro do corpo");
  const locked = positions.some((position) => {
    if (position.zoneLow == null || position.zoneHigh == null) return false;
    const touched = candidate.low <= position.zoneHigh && candidate.high >= position.zoneLow;
    const closedInside = candidate.close <= position.zoneHigh && candidate.close >= position.zoneLow;
    return touched && closedInside;
  });
  if (locked) failures.push("trava em posicionamento");
  const newExtreme =
    (candidate.color === "bullish" && candidate.close > previous.high && candidate.upperWick > EPS) ||
    (candidate.color === "bearish" && candidate.close < previous.low && candidate.lowerWick > EPS);
  if (!newExtreme) failures.push("não deixa nova alta nem nova baixa");
  return failures;
}

function exhaustion(candles: Candle[], doubles: Marking[], triples: Marking[]): Marking[] {
  const found: Marking[] = [];
  for (const pattern of [...doubles, ...triples]) {
    if (pattern.candleIndex == null) continue;
    const extraIndex = pattern.type === "DOUBLE_POSITION" ? pattern.candleIndex + 1 : pattern.candleIndex + 2;
    const extra = candles.find((candle) => candle.index === extraIndex);
    const host = candles.find((candle) => candle.index === pattern.candleIndex);
    if (!extra || !host || extra.color !== host.color) continue;
    found.push(
      marking({
        type: "EXHAUSTION",
        direction: pattern.direction,
        level: extra.close,
        candleIndex: extra.index,
        metadata: {
          pattern: pattern.type,
          source: "Guia, exaustão. Dupla ou tripla mais uma vela de continuação.",
        },
      }),
    );
  }
  return found;
}

function closedPrices(candles: Candle[]): Marking[] {
  return candles.filter(noCloseWick).map((candle) =>
    marking({
      type: "CLOSED_PRICE",
      direction: candle.color === "bullish" ? "BUY" : "SELL",
      level: candle.close,
      candleIndex: candle.index,
      metadata: {
        source:
          "Guia, preço fechado. Sem pavio no fechamento. No rompimento, a regra do comando prevalece: sem pavio não se pega.",
      },
    }),
  );
}

function forceCandles(candles: Candle[], positions: Marking[]): Marking[] {
  const found: Marking[] = [];
  for (const position of positions) {
    if (!position.metadata.recommended || position.candleIndex == null || position.zoneHigh == null || position.zoneLow == null) {
      continue;
    }
    const breaking = candles.find((candle) => {
      if (candle.index <= position.candleIndex!) return false;
      return position.direction === "BUY" ? candle.close > position.zoneHigh! : candle.close < position.zoneLow!;
    });
    if (!breaking) continue;
    const confirmation = candles.find((candle) => candle.index === breaking.index + 1 && candle.color === breaking.color);
    if (!confirmation) continue;
    found.push(
      marking({
        type: "FORCE",
        direction: breaking.color === "bullish" ? "BUY" : "SELL",
        level: confirmation.close,
        candleIndex: confirmation.index,
        metadata: {
          positioningIndex: position.candleIndex,
          source: "Apostila, força. Rompimento e a vela seguinte da mesma cor.",
        },
      }),
    );
  }
  return found;
}

function targets(candles: Candle[], runs: Run[], positions: Marking[]): Marking[] {
  const found: Marking[] = [];
  const zones = [
    ...runs.filter((run) => run.candles.length >= 2).map((run) => ({ index: run.end, high: run.high, low: run.low })),
    ...positions
      .filter((position) => position.metadata.recommended === true && position.zoneHigh != null && position.zoneLow != null)
      .map((position) => ({
        index: position.candleIndex ?? 0,
        high: position.zoneHigh as number,
        low: position.zoneLow as number,
      })),
  ];
  for (const zone of zones) {
    const later = candles.filter((candle) => candle.index > zone.index);
    const brokeUp = later.some((candle) => candle.close > zone.high);
    const brokeDown = later.some((candle) => candle.close < zone.low);
    if (brokeUp && brokeDown) continue;
    found.push(
      marking({
        type: brokeUp || brokeDown ? "CONNECTION_TARGET" : "LIQUIDITY_TARGET",
        direction: brokeUp ? "SELL" : brokeDown ? "BUY" : null,
        level: brokeDown ? zone.high : zone.low,
        zoneLow: zone.low,
        zoneHigh: zone.high,
        candleIndex: zone.index,
        metadata: {
          brokeUp,
          brokeDown,
          source: brokeUp || brokeDown ? "Apostila, alvo de conexão" : "Apostila, alvo de liquidez. Lado ainda não rompido.",
        },
      }),
    );
  }
  return found;
}

function noCloseWick(candle: Candle): boolean {
  if (candle.color === "bullish") return candle.upperWick <= EPS;
  if (candle.color === "bearish") return candle.lowerWick <= EPS;
  return false;
}

function closedBeyond(candle: Candle, level: number, side: "up" | "down"): boolean {
  return side === "up" ? candle.close > level : candle.close < level;
}

function wickZone(candle: Candle, side: "up" | "down"): { low: number; high: number; level: number } | null {
  if (side === "up" && candle.upperWick > EPS) {
    return { low: bodyTop(candle), high: candle.high, level: candle.high };
  }
  if (side === "down" && candle.lowerWick > EPS) {
    return { low: candle.low, high: bodyBottom(candle), level: candle.low };
  }
  return null;
}

function earlier(
  up: Candle | undefined,
  down: Candle | undefined,
): { candle: Candle; side: "up" | "down" } | null {
  if (up && down) return up.index <= down.index ? { candle: up, side: "up" } : { candle: down, side: "down" };
  if (up) return { candle: up, side: "up" };
  if (down) return { candle: down, side: "down" };
  return null;
}

function levelSetup(
  candles: Candle[],
  input: { ruleId: string; direction: Direction; candleIndex: number; level: number; label: string },
): DetectedSetup | null {
  const later = candles.filter((candle) => candle.index > input.candleIndex);
  const breaking = later.find((candle) =>
    input.direction === "BUY" ? candle.close > input.level : candle.close < input.level,
  );
  if (!breaking) return null;
  const hasWick = breaking.upperWick > EPS || breaking.lowerWick > EPS;
  if (!hasWick) return null;
  return {
    id: `${input.ruleId}-${input.candleIndex}`,
    ruleId: input.ruleId,
    concept: "ROMPIMENTO",
    direction: input.direction,
    candleIndex: breaking.index,
    level: input.level,
    structural: true,
    triggerConfirmed: false,
    missingConditions: [],
    evidence: [{ code: input.ruleId, description: input.label, candleIndex: input.candleIndex, level: input.level }],
    conflicts: [],
  };
}

function marking(input: Omit<Marking, "confidence"> & { confidence?: number }): Marking {
  return { confidence: input.confidence ?? 0.8, ...input };
}
