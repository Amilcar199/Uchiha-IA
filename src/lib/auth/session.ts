import { cookies } from "next/headers";
import { AppError } from "@/lib/errors";
import { readSession } from "@/lib/auth/password";
import { publicUser, readDb, type LocalUser } from "@/lib/store/local-store";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const SESSION_COOKIE = "uchiha_session";

export interface SessionUser {
  id: string;
  email: string;
  name: string;
  role: "USER" | "MENTOR" | "ADMIN";
  mode: "local" | "supabase";
}

export async function getCurrentUser(): Promise<SessionUser | null> {
  if (isSupabaseConfigured()) {
    const supabase = await createSupabaseServerClient();
    const { data } = await supabase.auth.getUser();
    if (!data.user) return null;
    const profile = await supabase.from("profiles").select("name, role").eq("user_id", data.user.id).maybeSingle();
    return {
      id: data.user.id,
      email: data.user.email ?? "",
      name: profile.data?.name ?? data.user.email ?? "Utilizador",
      role: profile.data?.role ?? "USER",
      mode: "supabase",
    };
  }

  const jar = await cookies();
  const userId = readSession(jar.get(SESSION_COOKIE)?.value);
  if (!userId) return null;
  const user = readDb().users.find((item) => item.id === userId);
  if (!user) return null;
  return { ...publicUser(user), mode: "local" };
}

export async function requireUser(): Promise<SessionUser> {
  const user = await getCurrentUser();
  if (!user) throw new AppError("AUTH_001", "Entre na sua conta para continuar.", 401);
  return user;
}

export function assertOwner(user: SessionUser, ownerId: string) {
  if (user.role === "ADMIN" || user.role === "MENTOR") return;
  if (user.id !== ownerId) throw new AppError("AUTH_002", "Não tem acesso a esta análise.", 403);
}

export function assertMentor(user: SessionUser) {
  if (user.role !== "MENTOR" && user.role !== "ADMIN") {
    throw new AppError("AUTH_003", "Só um mentor ou administrador pode registar este feedback.", 403);
  }
}

export type { LocalUser };
