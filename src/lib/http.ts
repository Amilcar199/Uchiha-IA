import { NextResponse } from "next/server";
import { toErrorPayload } from "@/lib/errors";

export async function handle(requestId: string, action: () => Promise<NextResponse>): Promise<NextResponse> {
  try {
    return await action();
  } catch (error) {
    const payload = toErrorPayload(error, requestId);
    console.error(JSON.stringify({ requestId, code: payload.body.error.code, technical: payload.technical }));
    return NextResponse.json(payload.body, { status: payload.status });
  }
}
