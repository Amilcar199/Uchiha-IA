import type { RuleParameters } from "@/config/rule-parameters";

export interface TimingResult {
  confirmed: boolean;
  status:
    | "INSIDE_WINDOW"
    | "OUTSIDE_WINDOW"
    | "UNKNOWN"
    | "OUT_OF_SCOPE"
    | "DISABLED"
    | "NOT_CURRENT_CANDLE";
  missingConditions: string[];
  notes: string[];
}

/**
 * Gatilho temporal da retração e do pico citado no rompimento.
 * Os 15 segundos estão no Guia. A aplicação a timeframes que não sejam M1 está pendente.
 * O pavio mostra que o preço visitou a região; não prova sozinho o instante dessa visita.
 */
export function evaluateTiming(input: {
  parameters: RuleParameters;
  timeframe: string;
  secondsElapsed: number | null;
  interactionCandleIndex: number | null;
  lastCandleIndex: number | null;
  structuralRejectionOrBreak: boolean;
}): TimingResult {
  const rule = input.parameters.first15SecondsRule;
  const notes = [
    "A janela de 15 segundos vem do Guia, para a retração no comando. Fora do M1 o alcance continua pendente.",
  ];

  if (!rule.enabled) {
    return {
      confirmed: false,
      status: "DISABLED",
      missingConditions: ["TIMING_RULE_DISABLED"],
      notes,
    };
  }

  if (!rule.applicableTimeframes.includes(input.timeframe)) {
    return {
      confirmed: false,
      status: "OUT_OF_SCOPE",
      missingConditions: ["FIRST_15S_TIMEFRAME_SCOPE"],
      notes,
    };
  }

  if (
    input.interactionCandleIndex == null ||
    input.lastCandleIndex == null ||
    input.interactionCandleIndex !== input.lastCandleIndex
  ) {
    return {
      confirmed: false,
      status: "NOT_CURRENT_CANDLE",
      missingConditions: ["TIMING_ON_CURRENT_CANDLE"],
      notes,
    };
  }

  if (input.secondsElapsed == null || Number.isNaN(input.secondsElapsed)) {
    return {
      confirmed: false,
      status: "UNKNOWN",
      missingConditions: ["SECONDS_ELAPSED"],
      notes,
    };
  }

  if (input.secondsElapsed < 0 || input.secondsElapsed > 60) {
    return {
      confirmed: false,
      status: "UNKNOWN",
      missingConditions: ["SECONDS_ELAPSED"],
      notes,
    };
  }

  if (!input.structuralRejectionOrBreak) {
    return {
      confirmed: false,
      status: "UNKNOWN",
      missingConditions: ["PRICE_REACTION"],
      notes,
    };
  }

  if (input.secondsElapsed > rule.windowSeconds) {
    return {
      confirmed: false,
      status: "OUTSIDE_WINDOW",
      missingConditions: ["INSIDE_FIRST_15_SECONDS"],
      notes: [...notes, "O movimento ficou fora dos 15 segundos iniciais. O Guia diz para não pegar a entrada."],
    };
  }

  return {
    confirmed: true,
    status: "INSIDE_WINDOW",
    missingConditions: [],
    notes: [
      ...notes,
      "Os segundos foram informados pelo utilizador e a vela atual mostra a reação. Isso não é um feed de ticks.",
    ],
  };
}
