import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { handle } from "@/lib/http";

export async function GET() {
  const requestId = crypto.randomUUID();
  return handle(requestId, async () => {
    const user = await getCurrentUser();
    return NextResponse.json({ user });
  });
}
