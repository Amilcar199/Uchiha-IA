import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth/session";
import { handle } from "@/lib/http";
import { getAnalysis, listOutcomes, removeAnalysis } from "@/repositories/analysis.repository";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function GET(_request: Request, context: RouteContext) {
  const requestId = crypto.randomUUID();
  return handle(requestId, async () => {
    const user = await requireUser();
    const { id } = await context.params;
    const record = await getAnalysis(user, id);
    const outcomes = await listOutcomes(id);
    return NextResponse.json({
      analysis: {
        id: record.id,
        asset: record.asset,
        marketRegime: record.marketRegime,
        platform: record.platform,
        timeframe: record.timeframe,
        cycle: record.cycle,
        trend: record.trend,
        decision: record.decision,
        confidence: record.confidence,
        ruleVersion: record.ruleVersion,
        createdAt: record.createdAt,
        imageUrl: `/api/analyses/${record.id}/image`,
        result: record.result,
        outcomes,
      },
    });
  });
}

export async function DELETE(_request: Request, context: RouteContext) {
  const requestId = crypto.randomUUID();
  return handle(requestId, async () => {
    const user = await requireUser();
    const { id } = await context.params;
    await removeAnalysis(user, id);
    return NextResponse.json({ ok: true });
  });
}
