import { existsSync, readFileSync } from "node:fs";
import { requireUser, type SessionUser } from "@/lib/auth/session";
import { AppError } from "@/lib/errors";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { imageFilePath } from "@/lib/store/local-store";
import { getAnalysis } from "@/repositories/analysis.repository";

export async function readAnalysisImage(id: string, user: SessionUser): Promise<Buffer> {
  const record = await getAnalysis(user, id);
  if (!record.imagePath) throw new AppError("STORAGE_002", "Esta análise não tem imagem.", 404);

  if (isSupabaseConfigured()) {
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase.storage.from("analysis-images").download(record.imagePath);
    if (error || !data) throw new AppError("STORAGE_002", "Não foi possível abrir a imagem.", 404, error?.message);
    return Buffer.from(await data.arrayBuffer());
  }

  const absolute = imageFilePath(record.imagePath);
  if (!existsSync(absolute)) throw new AppError("STORAGE_002", "A imagem já não está disponível.", 404);
  return readFileSync(absolute);
}

export async function readAnalysisImageForCurrentUser(id: string): Promise<Buffer> {
  const user = await requireUser();
  return readAnalysisImage(id, user);
}
