import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { z } from "zod";
import { hashPassword, signSession } from "@/lib/auth/password";
import { SESSION_COOKIE } from "@/lib/auth/session";
import { AppError } from "@/lib/errors";
import { handle } from "@/lib/http";
import { supabaseAuthMessage } from "@/lib/auth/supabase-errors";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { publicUser, readDb, writeDb } from "@/lib/store/local-store";

const schema = z.object({
  name: z.string().trim().min(2).max(80),
  email: z.string().trim().email(),
  password: z.string().min(8).max(72),
});

export async function POST(request: Request) {
  const requestId = crypto.randomUUID();
  return handle(requestId, async () => {
    const body = schema.safeParse(await request.json());
    if (!body.success) {
      throw new AppError("AUTH_004", "Nome, e-mail e palavra-passe (mínimo de 8 caracteres) são obrigatórios.", 400);
    }

    if (isSupabaseConfigured()) {
      const supabase = await createSupabaseServerClient();
      const { data, error } = await supabase.auth.signUp({
        email: body.data.email,
        password: body.data.password,
        options: { data: { name: body.data.name } },
      });
      if (error) throw new AppError("AUTH_005", supabaseAuthMessage(error.message, "Não foi possível criar a conta."), 400, error.message);
      if (!data.session) {
        return NextResponse.json({ ok: true, needsConfirmation: true, mode: "supabase" });
      }
      return NextResponse.json({ ok: true, mode: "supabase" });
    }

    const db = readDb();
    const email = body.data.email.toLowerCase();
    if (db.users.some((user) => user.email === email)) {
      throw new AppError("AUTH_006", "Já existe uma conta com este e-mail.", 409);
    }

    const now = new Date().toISOString();
    const password = hashPassword(body.data.password);
    const user = {
      id: crypto.randomUUID(),
      email,
      name: body.data.name,
      role: "USER" as const,
      passwordSalt: password.salt,
      passwordHash: password.hash,
      createdAt: now,
      updatedAt: now,
    };
    db.users.push(user);
    writeDb(db);

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
