import { NextResponse } from "next/server";
import { z } from "zod";
import { requireUser } from "@/lib/auth/session";
import { AppError } from "@/lib/errors";
import { handle } from "@/lib/http";
import { addFeedback } from "@/repositories/analysis.repository";

const schema = z.object({
  verdict: z.enum(["CORRETA", "INCORRETA", "PARCIAL"]),
  comment: z.string().trim().max(2000).default(""),
});

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function POST(request: Request, context: RouteContext) {
  const requestId = crypto.randomUUID();
  return handle(requestId, async () => {
    const user = await requireUser();
    const { id } = await context.params;
    const body = schema.safeParse(await request.json());
    if (!body.success) throw new AppError("FEEDBACK_001", "O parecer do mentor é obrigatório.", 400);
    const feedback = await addFeedback(user, {
      id: crypto.randomUUID(),
      analysisId: id,
      mentorId: user.id,
      verdict: body.data.verdict,
      comment: body.data.comment,
      createdAt: new Date().toISOString(),
    });
    return NextResponse.json(
      {
        feedback,
        note: "O feedback fica registado para revisão. Não altera a regra nem a análise original.",
      },
      { status: 201 },
    );
  });
}
