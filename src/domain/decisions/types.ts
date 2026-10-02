import type { Confluence } from "@/domain/rules/types";

export type DecisionState = "OPERAR_COMPRA" | "OPERAR_VENDA" | "AGUARDAR" | "NAO_OPERAR";

export type ReadingConfidence = "baixa" | "media" | "alta";

export interface AnalysisDecision {
  state: DecisionState;
  confidence: ReadingConfidence;
  confluences: Confluence[];
  missingConditions: string[];
  blockers: string[];
  explanation: string;
  ruleVersion: string;
}
