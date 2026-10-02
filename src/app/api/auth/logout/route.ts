import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { SESSION_COOKIE } from "@/lib/auth/session";
import { handle } from "@/lib/http";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function POST() {
  const requestId = crypto.randomUUID();
  return handle(requestId, async () => {
    if (isSupabaseConfigured()) {
      const supabase = await createSupabaseServerClient();
      await supabase.auth.signOut();
    }
    const jar = await cookies();
    jar.delete(SESSION_COOKIE);
    return NextResponse.json({ ok: true });
  });
}
