import type { Candle } from "@/domain/candles/types";
import { defaultRuleParameters, type RuleParameters } from "@/config/rule-parameters";
import type { AnalysisDecision } from "@/domain/decisions/types";
import type { AnalysisMetadata } from "@/domain/market/types";
import type { Marking, RuleResult } from "@/domain/rules/types";
import { evaluateConfluences } from "@/engines/confluence/confluence-engine";
import type { Confluence } from "@/domain/rules/types";
import { evaluateDecision } from "@/engines/decision/decision-engine";
import { assessSpace, defensesFromSwings } from "@/engines/defenses/defense-engine";
import { evaluateNews, type NewsAssessment } from "@/engines/news/news-engine";
import { evaluateTiming, type TimingResult } from "@/engines/sharingan/sharingan-engine";
import { evaluateScalp5s } from "@/engines/profile-5s/profile";
import { evaluateContext, type MarketContext } from "@/engines/supreme/supreme-engine";
import { evaluateUchiha, type UchihaEvaluation } from "@/engines/uchiha/uchiha-engine";
import { analyzeImage, type VisionReport } from "@/engines/vision/candle-extractor";
import { buildExplanation } from "@/engines/decision/explanation";

export interface AnalysisRequest {
  image?: Buffer;
  candles?: Candle[];
  metadata: AnalysisMetadata;
  parameters?: RuleParameters;
  requestId?: string;
}

export interface AnalysisResult {
  requestId: string;
  metadata: AnalysisMetadata;
  vision: VisionReport | null;
  context: MarketContext;
  uchiha: UchihaEvaluation;
  timing: TimingResult;
  news: NewsAssessment;
  confluences: Confluence[];
  independentCount: number;
  conflicts: string[];
  decision: AnalysisDecision;
  explanation: string[];
  markings: Marking[];
  ruleResults: RuleResult[];
  ruleVersion: string;
  durationsMs: {
    vision: number;
    rules: number;
    decision: number;
  };
}

export async function runAnalysis(request: AnalysisRequest): Promise<AnalysisResult> {
  const parameters = request.parameters ?? defaultRuleParameters;
  const requestId = request.requestId ?? crypto.randomUUID();
  const started = Date.now();

  let vision: VisionReport | null = null;
  let candles = request.candles ?? [];
  const visionStarted = Date.now();

  if (request.image) {
    vision = await analyzeImage(request.image, parameters.minimumCandlesForContext);
    candles = vision.candles;
  }

  const visionDuration = Date.now() - visionStarted;
  const rulesStarted = Date.now();
  const context = evaluateContext(candles, parameters.minimumCandlesForContext, parameters.tendentialConsecutiveCandles);
  const uchiha = evaluateUchiha({
    candles,
    trend: context.trend,
    cycle: context.cycle,
    cycleStatus: context.cycleStatus,
    parameters,
    secondsElapsed: request.metadata.secondsElapsed ?? null,
    timeframe: request.metadata.timeframe,
    marketRegime: request.metadata.marketRegime,
  });

  const primarySetup = uchiha.setups.find((setup) => setup.conflicts.length === 0) ?? null;
  const lastIndex = candles.length > 0 ? candles[candles.length - 1].index : null;
  const timing = evaluateTiming({
    parameters,
    timeframe: request.metadata.timeframe,
    secondsElapsed: request.metadata.secondsElapsed ?? null,
    interactionCandleIndex: primarySetup?.candleIndex ?? null,
    lastCandleIndex: lastIndex,
    structuralRejectionOrBreak: Boolean(primarySetup),
  });

  if (primarySetup) primarySetup.triggerConfirmed = timing.confirmed;

  const confluence = evaluateConfluences({
    context,
    setups: uchiha.setups,
    timing,
    markings: uchiha.markings,
    focusIndex: primarySetup?.candleIndex ?? null,
  });

  const defenses = defensesFromSwings(context.swings);
  const space =
    confluence.favoredDirection && primarySetup
      ? assessSpace({
          candles,
          defenses,
          direction: confluence.favoredDirection,
          referenceIndex: primarySetup.candleIndex,
          parameters,
        })
      : null;

  const scalp = evaluateScalp5s({
    enabled: parameters.scalp5sEnabled,
    candles,
    secondsElapsed: request.metadata.secondsElapsed ?? null,
    timeframe: request.metadata.timeframe,
  });
  if (scalp.blocked && scalp.reason) confluence.conflicts.push("SCALP_5S");

  const news = evaluateNews({
    asset: request.metadata.asset,
    marketRegime: request.metadata.marketRegime,
    declaration: request.metadata.newsDeclaration,
  });
  const rulesDuration = Date.now() - rulesStarted;

  const decisionStarted = Date.now();
  const imageAccepted = request.image ? Boolean(vision?.validation.accepted) : candles.length > 0;
  const imageBlockers = vision?.validation.blockers ?? (candles.length === 0 ? ["NO_CANDLES"] : []);
  const metadataMissing = missingMetadata(request.metadata);

  const decision = evaluateDecision({
    imageAccepted,
    imageBlockers,
    metadataComplete: metadataMissing.length === 0,
    metadataMissing,
    newsBlocks: news.blocksDecision,
    newsCaution: news.cautionOnly,
    newsMissing: news.missingConditions,
    contextOperable: context.cycleStatus === "CLASSIFIED" && context.cycle !== null,
    contextMissing: context.cycleStatus === "CLASSIFIED" ? [] : ["MARKET_CYCLE"],
    insufficientContext: context.insufficientContext || Boolean(vision?.insufficientContext),
    confluences: confluence.items,
    independentCount: confluence.independentCount,
    favoredDirection: confluence.favoredDirection,
    conflicts: confluence.conflicts,
    triggerConfirmed: timing.confirmed && confluence.favoredDirection !== null,
    triggerMissing: timing.missingConditions,
    spaceStatus: space?.status ?? "NOT_EVALUATED",
    spaceMissing: space?.missingConditions ?? ["SPACE_TO_NEXT_DEFENSE"],
    readingScore: vision?.globalConfidence ?? averageConfidence(candles),
  });

  const explanation = buildExplanation({
    decision,
    context,
    news,
    timing,
    confluences: confluence.items,
  });
  decision.explanation = explanation.join(" ");
  const decisionDuration = Date.now() - decisionStarted;

  logAnalysis({
    requestId,
    ruleVersion: parameters.version,
    visionDuration,
    rulesDuration,
    decisionDuration,
    total: Date.now() - started,
    state: decision.state,
  });

  return {
    requestId,
    metadata: request.metadata,
    vision,
    context,
    uchiha,
    timing,
    news,
    confluences: confluence.items,
    independentCount: confluence.independentCount,
    conflicts: confluence.conflicts,
    decision,
    explanation,
    markings: uchiha.markings,
    ruleResults: uchiha.ruleResults,
    ruleVersion: parameters.version,
    durationsMs: {
      vision: visionDuration,
      rules: rulesDuration,
      decision: decisionDuration,
    },
  };
}

function missingMetadata(metadata: AnalysisMetadata): string[] {
  const missing: string[] = [];
  if (!metadata.asset.trim()) missing.push("ASSET");
  if (!metadata.marketRegime) missing.push("MARKET_REGIME");
  if (!metadata.timeframe.trim()) missing.push("TIMEFRAME");
  return missing;
}

function averageConfidence(candles: Candle[]): number {
  if (candles.length === 0) return 0;
  return candles.reduce((sum, candle) => sum + candle.confidence, 0) / candles.length;
}

function logAnalysis(entry: Record<string, unknown>) {
  console.info(
    JSON.stringify({
      event: "analysis_completed",
      ...entry,
    }),
  );
}
