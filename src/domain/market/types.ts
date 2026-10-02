export type MarketRegime = "REAL" | "OTC";

export type Trend = "ALTA" | "BAIXA" | "LATERAL" | "INDEFINIDA";

export type Cycle =
  | "CONSOLIDADO"
  | "CORRECAO_LATERAL"
  | "CORRECAO_EM_TENDENCIA"
  | "TENDENCIA";

export type CycleStatus =
  | "CLASSIFIED"
  | "INSUFFICIENT_STRUCTURE"
  | "PENDING_MENTOR_VALIDATION";

export type OperationalConcept =
  | "RETRACAO"
  | "REVERSAO"
  | "ROMPIMENTO"
  | "CONTINUACAO";

export type Direction = "BUY" | "SELL";

export type NewsStatus = "FREE" | "ATTENTION" | "BLOCKED" | "UNKNOWN";

export interface AssetPair {
  raw: string;
  base: string | null;
  quote: string | null;
}

export interface AnalysisMetadata {
  asset: string;
  marketRegime: MarketRegime;
  timeframe: string;
  platform?: string | null;
  capturedAt?: string | null;
  secondsElapsed?: number | null;
  newsDeclaration: NewsStatus;
}
