/**
 * Parâmetros numéricos que os materiais não definem.
 * null = sem valor validado. A regra não pode fingir que o número existe.
 */
export interface RuleParameters {
  version: string;
  longWickRatio: number | null;
  smallWickRatio: number | null;
  defenseDistanceRatio: number | null;
  proximityTolerance: number | null;
  /** Janela em minutos. null até validação do mentor. */
  newsBlockWindowMinutes: number | null;
  first15SecondsRule: {
    enabled: boolean;
    /** Valor explícito no Guia para a retração. O alcance fora do M1 está pendente. */
    windowSeconds: number;
    applicableTimeframes: string[];
    status: "CONFIGURABLE" | "PENDING_MENTOR_VALIDATION";
  };
  /** Wick mínimo, em píxeis, ignorado só na quantização da visão. Não é "pavio longo". */
  visionWickQuantizationPx: number;
  minimumCandlesForContext: number;
  minimumReadableCandles: number;
}

export const RULE_VERSION = "1.0.0";

export const defaultRuleParameters: RuleParameters = {
  version: RULE_VERSION,
  longWickRatio: null,
  smallWickRatio: null,
  defenseDistanceRatio: null,
  proximityTolerance: null,
  newsBlockWindowMinutes: null,
  first15SecondsRule: {
    enabled: true,
    windowSeconds: 15,
    applicableTimeframes: ["M1"],
    status: "PENDING_MENTOR_VALIDATION",
  },
  visionWickQuantizationPx: 0,
  minimumCandlesForContext: 15,
  minimumReadableCandles: 5,
};

export type ParameterStatus = "VALIDATED" | "PENDING_MENTOR_VALIDATION" | "CONFIGURABLE";

export function parameterStatus(parameters: RuleParameters): Record<string, ParameterStatus> {
  return {
    longWickRatio: parameters.longWickRatio == null ? "PENDING_MENTOR_VALIDATION" : "VALIDATED",
    smallWickRatio: parameters.smallWickRatio == null ? "PENDING_MENTOR_VALIDATION" : "VALIDATED",
    defenseDistanceRatio:
      parameters.defenseDistanceRatio == null ? "PENDING_MENTOR_VALIDATION" : "VALIDATED",
    proximityTolerance:
      parameters.proximityTolerance == null ? "PENDING_MENTOR_VALIDATION" : "VALIDATED",
    newsBlockWindowMinutes:
      parameters.newsBlockWindowMinutes == null ? "PENDING_MENTOR_VALIDATION" : "VALIDATED",
    first15SecondsRule: parameters.first15SecondsRule.status,
  };
}
