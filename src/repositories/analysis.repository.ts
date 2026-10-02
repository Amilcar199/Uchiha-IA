import type { SessionUser } from "@/lib/auth/session";
import { assertMentor, assertOwner } from "@/lib/auth/session";
import { AppError } from "@/lib/errors";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import {
  deleteImage,
  readDb,
  writeDb,
  type AnalysisRecord,
  type FeedbackRecord,
  type OutcomeRecord,
} from "@/lib/store/local-store";

export interface AnalysisFilters {
  asset?: string;
  timeframe?: string;
  regime?: string;
  cycle?: string;
  decision?: string;
  from?: string;
  to?: string;
}

export async function saveAnalysis(record: AnalysisRecord): Promise<AnalysisRecord> {
  if (isSupabaseConfigured()) {
    const supabase = await createSupabaseServerClient();
    const { error } = await supabase.from("analyses").insert({
      id: record.id,
      user_id: record.userId,
      asset: record.asset,
      market_regime: record.marketRegime,
      platform: record.platform,
      timeframe: record.timeframe,
      analysis_status: "COMPLETED",
      cycle: record.cycle,
      trend: record.trend,
      decision: record.decision,
      confidence: record.confidence,
      rule_version: record.ruleVersion,
      image_path: record.imagePath,
      payload: record.result,
      created_at: record.createdAt,
      updated_at: record.updatedAt,
    });
    if (error) throw new AppError("DB_001", "Não foi possível guardar a análise.", 500, error.message);

    if (record.result.vision?.candles.length) {
      const { error: candleError } = await supabase.from("candles").insert(
        record.result.vision.candles.map((candle) => ({
          analysis_id: record.id,
          index: candle.index,
          open: candle.open,
          close: candle.close,
          high: candle.high,
          low: candle.low,
          body_size: candle.bodySize,
          upper_wick: candle.upperWick,
          lower_wick: candle.lowerWick,
          range: candle.range,
          color: candle.color,
          confidence: candle.confidence,
        })),
      );
      if (candleError) throw new AppError("DB_001", "Não foi possível guardar as velas.", 500, candleError.message);
    }

    const { error: decisionError } = await supabase.from("decisions").insert({
      analysis_id: record.id,
      state: record.decision,
      confidence: record.confidence,
      explanation: record.result.decision.explanation,
      blockers: record.result.decision.blockers,
      missing_conditions: record.result.decision.missingConditions,
      rule_version: record.ruleVersion,
    });
    if (decisionError) {
      throw new AppError("DB_001", "Não foi possível guardar a decisão.", 500, decisionError.message);
    }
    return record;
  }

  const db = readDb();
  db.analyses.unshift(record);
  writeDb(db);
  return record;
}

export async function listAnalyses(user: SessionUser, filters: AnalysisFilters): Promise<AnalysisRecord[]> {
  const records = isSupabaseConfigured() ? await listFromSupabase(user) : listFromLocal(user);
  return records.filter((record) => matches(record, filters));
}

export async function getAnalysis(user: SessionUser, id: string): Promise<AnalysisRecord> {
  const record = isSupabaseConfigured() ? await getFromSupabase(id) : readDb().analyses.find((item) => item.id === id);
  if (!record) throw new AppError("ANALYSIS_001", "Análise não encontrada.", 404);
  assertOwner(user, record.userId);
  return record;
}

export async function removeAnalysis(user: SessionUser, id: string): Promise<void> {
  const record = await getAnalysis(user, id);
  if (user.id !== record.userId && user.role !== "ADMIN") {
    throw new AppError("AUTH_002", "Só o autor ou um administrador pode apagar esta análise.", 403);
  }

  if (isSupabaseConfigured()) {
    const supabase = await createSupabaseServerClient();
    if (record.imagePath) {
      await supabase.storage.from("analysis-images").remove([record.imagePath]);
    }
    const { error } = await supabase.from("analyses").delete().eq("id", id);
    if (error) throw new AppError("DB_001", "Não foi possível apagar a análise.", 500, error.message);
    return;
  }

  const db = readDb();
  db.analyses = db.analyses.filter((item) => item.id !== id);
  db.outcomes = db.outcomes.filter((item) => item.analysisId !== id);
  writeDb(db);
  deleteImage(record.imagePath);
}

export async function addOutcome(user: SessionUser, outcome: OutcomeRecord): Promise<OutcomeRecord> {
  await getAnalysis(user, outcome.analysisId);
  if (isSupabaseConfigured()) {
    const supabase = await createSupabaseServerClient();
    const { error } = await supabase.from("analysis_outcomes").insert({
      id: outcome.id,
      analysis_id: outcome.analysisId,
      user_id: outcome.userId,
      followed: outcome.followed,
      result: outcome.result,
      created_at: outcome.createdAt,
    });
    if (error) throw new AppError("DB_001", "Não foi possível guardar o resultado.", 500, error.message);
    return outcome;
  }
  const db = readDb();
  db.outcomes.unshift(outcome);
  writeDb(db);
  return outcome;
}

export async function listOutcomes(analysisId: string): Promise<OutcomeRecord[]> {
  if (isSupabaseConfigured()) return [];
  return readDb().outcomes.filter((item) => item.analysisId === analysisId);
}

export async function addFeedback(user: SessionUser, feedback: FeedbackRecord): Promise<FeedbackRecord> {
  assertMentor(user);
  await getAnalysis(user, feedback.analysisId);
  if (isSupabaseConfigured()) {
    const supabase = await createSupabaseServerClient();
    const { error } = await supabase.from("mentor_feedback").insert({
      id: feedback.id,
      analysis_id: feedback.analysisId,
      mentor_id: feedback.mentorId,
      verdict: feedback.verdict,
      comment: feedback.comment,
      created_at: feedback.createdAt,
    });
    if (error) throw new AppError("DB_001", "Não foi possível guardar o feedback.", 500, error.message);
    return feedback;
  }
  const db = readDb();
  db.feedback.unshift(feedback);
  db.audit.unshift({
    id: crypto.randomUUID(),
    actorId: user.id,
    action: "MENTOR_FEEDBACK",
    target: feedback.analysisId,
    previousVersion: null,
    nextVersion: null,
    createdAt: feedback.createdAt,
  });
  writeDb(db);
  return feedback;
}

function listFromLocal(user: SessionUser): AnalysisRecord[] {
  const analyses = readDb().analyses;
  if (user.role === "ADMIN" || user.role === "MENTOR") return analyses;
  return analyses.filter((item) => item.userId === user.id);
}

async function listFromSupabase(user: SessionUser): Promise<AnalysisRecord[]> {
  const supabase = await createSupabaseServerClient();
  let query = supabase.from("analyses").select("*").order("created_at", { ascending: false });
  if (user.role === "USER") query = query.eq("user_id", user.id);
  const { data, error } = await query;
  if (error) throw new AppError("DB_001", "Não foi possível ler o histórico.", 500, error.message);
  return (data ?? []).map(mapRow);
}

async function getFromSupabase(id: string): Promise<AnalysisRecord | undefined> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.from("analyses").select("*").eq("id", id).maybeSingle();
  if (error) throw new AppError("DB_001", "Não foi possível ler a análise.", 500, error.message);
  return data ? mapRow(data) : undefined;
}

function mapRow(row: Record<string, unknown>): AnalysisRecord {
  return {
    id: String(row.id),
    userId: String(row.user_id),
    asset: String(row.asset),
    marketRegime: row.market_regime as AnalysisRecord["marketRegime"],
    platform: (row.platform as string | null) ?? null,
    timeframe: String(row.timeframe),
    cycle: (row.cycle as string | null) ?? null,
    trend: String(row.trend),
    decision: row.decision as AnalysisRecord["decision"],
    confidence: row.confidence as AnalysisRecord["confidence"],
    ruleVersion: String(row.rule_version),
    imagePath: (row.image_path as string | null) ?? null,
    result: row.payload as AnalysisRecord["result"],
    createdAt: String(row.created_at),
    updatedAt: String(row.updated_at),
  };
}

function matches(record: AnalysisRecord, filters: AnalysisFilters): boolean {
  if (filters.asset && !record.asset.toLowerCase().includes(filters.asset.toLowerCase())) return false;
  if (filters.timeframe && record.timeframe !== filters.timeframe) return false;
  if (filters.regime && record.marketRegime !== filters.regime) return false;
  if (filters.cycle && record.cycle !== filters.cycle) return false;
  if (filters.decision && record.decision !== filters.decision) return false;
  if (filters.from && record.createdAt < filters.from) return false;
  if (filters.to && record.createdAt > filters.to) return false;
  return true;
}
