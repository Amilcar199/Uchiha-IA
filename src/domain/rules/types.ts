import type { Candle } from "@/domain/candles/types";
import type {
  Cycle,
  CycleStatus,
  Direction,
  MarketRegime,
  OperationalConcept,
  Trend,
} from "@/domain/market/types";
import type { RuleParameters } from "@/config/rule-parameters";

export interface RuleSource {
  document: string;
  section: string;
  page?: string;
  description: string;
}

export interface Evidence {
  code: string;
  description: string;
  candleIndex?: number;
  level?: number;
}

export interface Conflict {
  code: string;
  description: string;
}

export interface RuleResult {
  triggered: boolean;
  confidence: number;
  evidence: Evidence[];
  conflicts?: Conflict[];
  missingConditions?: string[];
  sourceRuleId: string;
}

export interface RuleContext {
  candles: Candle[];
  trend: Trend;
  cycle: Cycle | null;
  cycleStatus: CycleStatus;
  parameters: RuleParameters;
  secondsElapsed: number | null;
  timeframe: string;
  marketRegime: MarketRegime;
}

export interface TradingRule {
  id: string;
  name: string;
  version: string;
  description: string;
  enabled: boolean;
  source: RuleSource;
  detect(context: RuleContext): RuleResult;
}

export type MarkingType =
  | "COMMAND"
  | "SINGLE_RATE"
  | "MAGIC_CANDLE"
  | "DIVIDED_RATE"
  | "NEW_POSITION"
  | "FIRST_RECORD"
  | "NEW_HIGH"
  | "NEW_LOW"
  | "DEFENSE"
  | "LOT"
  | "DOUBLE_POSITION"
  | "TRIPLE_POSITION"
  | "POSITIONING"
  | "DOMAIN"
  | "LOT_CONNECTION"
  | "EXHAUSTION"
  | "CLOSED_PRICE"
  | "FORCE"
  | "LIQUIDITY_TARGET"
  | "CONNECTION_TARGET"
  | "CLASSIC";

export interface Marking {
  type: MarkingType;
  direction: Direction | null;
  level: number | null;
  zoneLow?: number | null;
  zoneHigh?: number | null;
  candleIndex: number | null;
  confidence: number;
  metadata: Record<string, unknown>;
}

export interface DetectedSetup {
  id: string;
  ruleId: string;
  concept: OperationalConcept;
  direction: Direction;
  candleIndex: number;
  level: number;
  structural: boolean;
  triggerConfirmed: boolean;
  missingConditions: string[];
  evidence: Evidence[];
  conflicts: Conflict[];
}

export interface SwingPoint {
  index: number;
  price: number;
  kind: "high" | "low";
}

export interface Confluence {
  type: string;
  direction: Direction;
  weight: number;
  evidence: string;
  ruleId: string;
  family: string;
}
