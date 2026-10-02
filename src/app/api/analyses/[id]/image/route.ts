import { NextResponse } from "next/server";
import { handle } from "@/lib/http";
import { readAnalysisImageForCurrentUser } from "@/lib/storage/read-analysis-image";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function GET(_request: Request, context: RouteContext) {
  const requestId = crypto.randomUUID();
  return handle(requestId, async () => {
    const { id } = await context.params;
    const bytes = await readAnalysisImageForCurrentUser(id);
    return new NextResponse(new Uint8Array(bytes), {
      headers: {
        "Content-Type": "image/png",
        "Cache-Control": "private, max-age=3600",
      },
    });
  });
}
