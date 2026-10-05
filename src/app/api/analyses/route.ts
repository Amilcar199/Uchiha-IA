import sharp from "sharp";
import { NextResponse } from "next/server";
import { z } from "zod";
import { requireUser } from "@/lib/auth/session";
import { AppError } from "@/lib/errors";
import { handle } from "@/lib/http";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { saveImage } from "@/lib/store/local-store";
import { listAnalyses, saveAnalysis, type AnalysisFilters } from "@/repositories/analysis.repository";
import { runAnalysis } from "@/engines/orchestrator/analysis-orchestrator";
import type { MarketRegime, NewsStatus } from "@/domain/market/types";

export const maxDuration = 60;

const metadataSchema = z.object({
  asset: z.string().trim().min(3).max(24),
  marketRegime: z.enum(["REAL", "OTC"]),
  timeframe: z.enum(["M1", "M5", "M15"]),
  platform: z.string().trim().max(40).optional(),
  secondsElapsed: z.string().optional(),
  newsDeclaration: z.enum(["FREE", "ATTENTION", "BLOCKED", "UNKNOWN"]),
});

export async function GET(request: Request) {
  const requestId = crypto.randomUUID();
  return handle(requestId, async () => {
    const user = await requireUser();
    const url = new URL(request.url);
    const filters: AnalysisFilters = {
      asset: url.searchParams.get("asset") ?? undefined,
      timeframe: url.searchParams.get("timeframe") ?? undefined,
      regime: url.searchParams.get("regime") ?? undefined,
      cycle: url.searchParams.get("cycle") ?? undefined,
      decision: url.searchParams.get("decision") ?? undefined,
      from: url.searchParams.get("from") ?? undefined,
      to: url.searchParams.get("to") ?? undefined,
    };
    const analyses = await listAnalyses(user, filters);
    return NextResponse.json({
      analyses: analyses.map((item) => ({
        id: item.id,
        asset: item.asset,
        marketRegime: item.marketRegime,
        timeframe: item.timeframe,
        cycle: item.cycle,
        trend: item.trend,
        decision: item.decision,
        confidence: item.confidence,
        ruleVersion: item.ruleVersion,
        createdAt: item.createdAt,
      })),
    });
  });
}

export async function POST(request: Request) {
  const requestId = crypto.randomUUID();
  return handle(requestId, async () => {
    const user = await requireUser();
    const form = await request.formData();
    const parsed = metadataSchema.safeParse({
      asset: form.get("asset"),
      marketRegime: form.get("marketRegime"),
      timeframe: form.get("timeframe"),
      platform: form.get("platform") || undefined,
      secondsElapsed: form.get("secondsElapsed") || undefined,
      newsDeclaration: form.get("newsDeclaration"),
    });
    if (!parsed.success) {
      throw new AppError("ANALYSIS_002", "Preencha ativo, regime, timeframe e o estado da notícia.", 400);
    }

    const file = form.get("image");
    if (!(file instanceof File)) {
      throw new AppError("VISION_003", "Envie o print do gráfico.", 400);
    }
    if (file.size > 4 * 1024 * 1024) {
      throw new AppError("VISION_004", "A imagem passa de 4 MB. Recorte só a área do gráfico e envie de novo.", 400);
    }

    const secondsRaw = parsed.data.secondsElapsed;
    const secondsElapsed =
      secondsRaw == null || secondsRaw === "" ? null : Number(secondsRaw);
    if (secondsElapsed != null && (Number.isNaN(secondsElapsed) || secondsElapsed < 0 || secondsElapsed > 60)) {
      throw new AppError("ANALYSIS_003", "Os segundos da vela atual têm de estar entre 0 e 60.", 400);
    }

    let bytes: Buffer;
    try {
      bytes = await sharp(Buffer.from(await file.arrayBuffer()))
        .rotate()
        .resize({ width: 1200, height: 1200, fit: "inside", withoutEnlargement: true })
        .png()
        .toBuffer();
    } catch {
      throw new AppError(
        "VISION_005",
        "Não consegui abrir essa captura. Envie um PNG ou JPG do gráfico, ou cole a imagem com Ctrl+V.",
        400,
      );
    }
    const result = await runAnalysis({
      image: bytes,
      requestId,
      metadata: {
        asset: parsed.data.asset.toUpperCase(),
        marketRegime: parsed.data.marketRegime as MarketRegime,
        timeframe: parsed.data.timeframe,
        platform: parsed.data.platform || null,
        secondsElapsed,
        newsDeclaration: parsed.data.newsDeclaration as NewsStatus,
      },
    });

    const id = crypto.randomUUID();
    const now = new Date();
    const imagePath = await storeImage(user.id, id, now, bytes);
    const record = await saveAnalysis({
      id,
      userId: user.id,
      asset: result.metadata.asset,
      marketRegime: result.metadata.marketRegime,
      platform: result.metadata.platform ?? null,
      timeframe: result.metadata.timeframe,
      cycle: result.context.cycle,
      trend: result.context.trend,
      decision: result.decision.state,
      confidence: result.decision.confidence,
      ruleVersion: result.ruleVersion,
      imagePath,
      result,
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
    });

    return NextResponse.json({ id: record.id, decision: record.decision, confidence: record.confidence }, { status: 201 });
  });
}

async function storeImage(userId: string, analysisId: string, date: Date, bytes: Buffer): Promise<string> {
  const year = String(date.getUTCFullYear());
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  const key = `${userId}/${year}/${month}/${analysisId}/original.png`;

  if (isSupabaseConfigured()) {
    const supabase = await createSupabaseServerClient();
    const { error } = await supabase.storage.from("analysis-images").upload(key, bytes, {
      contentType: "image/png",
      upsert: false,
    });
    if (error) throw new AppError("STORAGE_001", "Não foi possível guardar a imagem.", 500, error.message);
    return key;
  }

  const relative = `images/${key}`;
  saveImage(relative, bytes);
  return relative;
}
