import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { z } from "zod";
import { signSession, verifyPassword } from "@/lib/auth/password";
import { SESSION_COOKIE } from "@/lib/auth/session";
import { AppError } from "@/lib/errors";
import { handle } from "@/lib/http";
import { supabaseAuthMessage } from "@/lib/auth/supabase-errors";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { publicUser, readDb } from "@/lib/store/local-store";

const schema = z.object({
  email: z.string().trim().email(),
  password: z.string().min(8).max(72),
});

export async function POST(request: Request) {
  const requestId = crypto.randomUUID();
  return handle(requestId, async () => {
    const body = schema.safeParse(await request.json());
    if (!body.success) throw new AppError("AUTH_004", "E-mail ou palavra-passe inválidos.", 400);

    if (isSupabaseConfigured()) {
      const supabase = await createSupabaseServerClient();
      const { error } = await supabase.auth.signInWithPassword({
        email: body.data.email,
        password: body.data.password,
      });
      if (error) throw new AppError("AUTH_007", supabaseAuthMessage(error.message, "E-mail ou palavra-passe não conferem."), 401, error.message);
      return NextResponse.json({ ok: true, mode: "supabase" });
    }

    const email = body.data.email.toLowerCase();
    const user = readDb().users.find((item) => item.email === email);
    if (!user || !verifyPassword(body.data.password, user.passwordSalt, user.passwordHash)) {
      throw new AppError("AUTH_007", "E-mail ou palavra-passe não conferem.", 401);
    }

    const jar = await cookies();
    jar.set(SESSION_COOKIE, signSession(user.id), {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
    });

    return NextResponse.json({ ok: true, user: publicUser(user), mode: "local" });
  });
}
