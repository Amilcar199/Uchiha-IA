import { NextResponse } from "next/server";
import { z } from "zod";
import { requireUser } from "@/lib/auth/session";
import { AppError } from "@/lib/errors";
import { handle } from "@/lib/http";
import { addOutcome, getAnalysis } from "@/repositories/analysis.repository";

const schema = z.object({
  followed: z.enum(["SEGUIU", "NAO_SEGUIU"]),
  result: z.enum(["GAIN", "LOSS", "NO_TRADE"]),
});

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function POST(request: Request, context: RouteContext) {
  const requestId = crypto.randomUUID();
  return handle(requestId, async () => {
    const user = await requireUser();
    const { id } = await context.params;
    await getAnalysis(user, id);
    const body = schema.safeParse(await request.json());
    if (!body.success) {
      throw new AppError("OUTCOME_001", "Indique se seguiu a leitura e o resultado.", 400);
    }
    if (user.role !== "ADMIN" && user.role !== "MENTOR") {
      const record = await getAnalysis(user, id);
      if (record.userId !== user.id) {
        throw new AppError("AUTH_002", "Não tem acesso a esta análise.", 403);
      }
    }
    const outcome = await addOutcome(user, {
      id: crypto.randomUUID(),
      analysisId: id,
      userId: user.id,
      followed: body.data.followed,
      result: body.data.result,
      createdAt: new Date().toISOString(),
    });
    return NextResponse.json({ outcome }, { status: 201 });
  });
}
