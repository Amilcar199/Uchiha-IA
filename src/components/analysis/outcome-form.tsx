"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function OutcomeForm({ analysisId }: { analysisId: string }) {
  const router = useRouter();
  const [message, setMessage] = useState<string | null>(null);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const response = await fetch(`/api/analyses/${analysisId}/outcome`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        followed: form.get("followed"),
        result: form.get("result"),
      }),
    });
    const payload = await response.json();
    setMessage(response.ok ? "Resultado registado, sem alterar a análise original." : payload.error?.message);
    if (response.ok) router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="grid gap-3 border border-[#2c3444] p-4">
      <h3 className="text-sm font-medium">Resultado posterior</h3>
      <div className="grid gap-3 md:grid-cols-2">
        <select name="followed" className="border border-[#2c3444] bg-[#10141b] px-3 py-2 text-sm" defaultValue="NAO_SEGUIU">
          <option value="SEGUIU">Seguiu</option>
          <option value="NAO_SEGUIU">Não seguiu</option>
        </select>
        <select name="result" className="border border-[#2c3444] bg-[#10141b] px-3 py-2 text-sm" defaultValue="NO_TRADE">
          <option value="GAIN">Gain</option>
          <option value="LOSS">Loss</option>
          <option value="NO_TRADE">Não operou</option>
        </select>
      </div>
      <button type="submit" className="w-fit border border-[#2c3444] px-3 py-2 text-sm">
        Registar resultado
      </button>
      {message ? <p className="text-sm text-[#d6d3d1]">{message}</p> : null}
    </form>
  );
}
