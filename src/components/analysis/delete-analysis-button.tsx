"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function DeleteAnalysisButton({ analysisId }: { analysisId: string }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  async function onDelete() {
    if (!window.confirm("Apagar esta análise e a imagem?")) return;
    const response = await fetch(`/api/analyses/${analysisId}`, { method: "DELETE" });
    if (!response.ok) {
      const payload = await response.json();
      setError(payload.error?.message ?? "Não foi possível apagar.");
      return;
    }
    router.push("/analyses");
    router.refresh();
  }

  return (
    <div>
      <button type="button" onClick={onDelete} className="btn-ghost">
        Apagar análise
      </button>
      {error ? <p className="mt-2 text-sm text-rose-200">{error}</p> : null}
    </div>
  );
}
