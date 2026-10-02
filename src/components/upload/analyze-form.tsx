"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function AnalyzeForm() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setPending(true);
    const response = await fetch("/api/analyses", {
      method: "POST",
      body: new FormData(event.currentTarget),
    });
    const payload = await response.json();
    setPending(false);
    if (!response.ok) {
      setError(payload.error?.message ?? "Não foi possível analisar o gráfico.");
      return;
    }
    router.push(`/analyses/${payload.id}`);
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="grid gap-5">
      <label className="grid gap-2 text-sm">
        Print do gráfico
        <input name="image" type="file" accept="image/png,image/jpeg,image/webp" required className="text-[#d6d3d1]" />
      </label>
      <div className="grid gap-4 md:grid-cols-2">
        <Field label="Ativo / par" name="asset" placeholder="EUR/USD" required />
        <label className="grid gap-2 text-sm">
          Regime
          <select name="marketRegime" className="border border-[#2c3444] bg-[#10141b] px-3 py-2" required defaultValue="REAL">
            <option value="REAL">Mercado real</option>
            <option value="OTC">OTC</option>
          </select>
        </label>
        <label className="grid gap-2 text-sm">
          Timeframe
          <select name="timeframe" className="border border-[#2c3444] bg-[#10141b] px-3 py-2" defaultValue="M1">
            <option value="M1">M1</option>
            <option value="M5">M5</option>
            <option value="M15">M15</option>
          </select>
        </label>
        <Field label="Plataforma" name="platform" placeholder="Quotex, Pocket Option..." />
        <Field label="Segundos da vela atual" name="secondsElapsed" type="number" placeholder="0 a 60" />
        <label className="grid gap-2 text-sm">
          Notícia
          <select name="newsDeclaration" className="border border-[#2c3444] bg-[#10141b] px-3 py-2" defaultValue="UNKNOWN">
            <option value="UNKNOWN">Não informado</option>
            <option value="FREE">Livre</option>
            <option value="ATTENTION">Atenção</option>
            <option value="BLOCKED">Bloqueio de alto impacto</option>
          </select>
        </label>
      </div>
      {error ? <p className="text-sm text-rose-200">{error}</p> : null}
      <button type="submit" disabled={pending} className="w-fit bg-[#e7e5e4] px-4 py-2 text-sm font-medium text-[#10141b] disabled:opacity-60">
        {pending ? "A ler o gráfico..." : "Analisar screenshot"}
      </button>
    </form>
  );
}

function Field({
  label,
  name,
  placeholder,
  required,
  type = "text",
}: {
  label: string;
  name: string;
  placeholder?: string;
  required?: boolean;
  type?: string;
}) {
  return (
    <label className="grid gap-2 text-sm">
      {label}
      <input
        name={name}
        type={type}
        required={required}
        placeholder={placeholder}
        className="border border-[#2c3444] bg-[#10141b] px-3 py-2 outline-none"
      />
    </label>
  );
}
