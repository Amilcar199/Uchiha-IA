import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth/session";
import { handle } from "@/lib/http";
import { getAnalysis } from "@/repositories/analysis.repository";
import { readAnalysisImage } from "@/lib/storage/read-analysis-image";
import { runAnalysis } from "@/engines/orchestrator/analysis-orchestrator";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function POST(_request: Request, context: RouteContext) {
  const requestId = crypto.randomUUID();
  return handle(requestId, async () => {
    const user = await requireUser();
    const { id } = await context.params;
    const record = await getAnalysis(user, id);
    const image = await readAnalysisImage(id, user);
    const vision = await runAnalysis({
      image,
      requestId,
      metadata: record.result.metadata,
    });
    return NextResponse.json({
      accepted: vision.vision?.validation.accepted ?? false,
      code: vision.vision?.validation.code ?? null,
      message: vision.vision?.validation.userMessage ?? null,
      candles: vision.vision?.candles ?? [],
      confidence: vision.vision?.globalConfidence ?? 0,
      warnings: vision.vision?.warnings ?? [],
      insufficientContext: vision.vision?.insufficientContext ?? true,
    });
  });
}
