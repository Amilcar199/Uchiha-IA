import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth/session";
import { handle } from "@/lib/http";
import { getAnalysis } from "@/repositories/analysis.repository";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function POST(_request: Request, context: RouteContext) {
  const requestId = crypto.randomUUID();
  return handle(requestId, async () => {
    const user = await requireUser();
    const { id } = await context.params;
    const record = await getAnalysis(user, id);
    return NextResponse.json({
      decision: record.result.decision,
      confluences: record.result.confluences,
      conflicts: record.result.conflicts,
      explanation: record.result.explanation,
      ruleVersion: record.result.ruleVersion,
      note: "A avaliação guardada não é recalculada com regras novas. Uma análise antiga permanece na versão com que foi feita.",
    });
  });
}
