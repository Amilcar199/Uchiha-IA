"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function AnalyzeForm() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);

  function takeFile(next: File | null) {
    setFile(next);
    setFileName(next?.name ?? null);
    setError(null);
  }

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!file) {
      setError("Envie ou cole a captura do gráfico.");
      return;
    }
    setError(null);
    setPending(true);
    const controller = new AbortController();
    const timer = window.setTimeout(() => controller.abort(), 50000);
    try {
      const image = await shrinkScreenshot(file);
      const body = new FormData(event.currentTarget);
      body.set("image", image);
      const response = await fetch("/api/analyses", {
        method: "POST",
        body,
        signal: controller.signal,
      });
      const payload = await response.json().catch(() => null);
      if (!response.ok || !payload?.id) {
        setError(payload?.error?.message ?? "Não foi possível analisar o gráfico. A captura precisa mostrar as velas verdes e vermelhas.");
        return;
      }
      router.push(`/analyses/${payload.id}`);
      router.refresh();
    } catch {
      setError("A leitura não respondeu. Cole a captura com Ctrl+V ou envie um PNG/JPG só da área do gráfico.");
    } finally {
      window.clearTimeout(timer);
      setPending(false);
    }
  }

  return (
    <form
      onSubmit={onSubmit}
      className="grid gap-5"
      onPaste={(event) => {
        const pasted = [...event.clipboardData.items].find((item) => item.type.startsWith("image/"))?.getAsFile();
        if (!pasted) return;
        event.preventDefault();
        takeFile(pasted);
      }}
    >
      <label
        onDragOver={(event) => event.preventDefault()}
        onDrop={(event) => {
          event.preventDefault();
          const dropped = [...event.dataTransfer.files].find((item) => item.type.startsWith("image/"));
          if (dropped) takeFile(dropped);
        }}
        className="group flex min-h-56 cursor-pointer flex-col items-center justify-center rounded-[1.6rem] border border-dashed border-white/15 bg-white/[0.03] px-6 text-center shadow-[0_0_80px_rgba(255,45,74,0.08)] transition hover:border-[#ff2d4a]/70 hover:bg-[#ff2d4a]/[0.04]"
      >
        <span className="flex h-12 w-12 items-center justify-center rounded-2xl border border-white/10 bg-[#11131a] text-[#ff8a98]">
          <UploadIcon />
        </span>
        <span className="mt-4 text-lg font-semibold">{fileName ?? "Solte o print do gráfico"}</span>
        <span className="mt-2 text-sm text-[#9aa3b2]">PNG, JPG ou WEBP · arraste, escolha o ficheiro ou cole com Ctrl+V</span>
        <input
          name="image"
          type="file"
          accept="image/png,image/jpeg,image/webp"
          required={!file}
          className="sr-only"
          onChange={(event) => takeFile(event.target.files?.[0] ?? null)}
        />
      </label>

      <div className="surface grid gap-4 p-5 md:grid-cols-2">
        <Field label="Ativo / par" name="asset" placeholder="EUR/USD" required />
        <label className="grid gap-2 text-sm text-[#d4d4d8]">
          Regime
          <select name="marketRegime" className="field" required defaultValue="REAL">
            <option value="REAL">Mercado real</option>
            <option value="OTC">OTC</option>
          </select>
        </label>
        <label className="grid gap-2 text-sm text-[#d4d4d8]">
          Timeframe
          <select name="timeframe" className="field" defaultValue="M1">
            <option value="M1">M1</option>
            <option value="M5">M5</option>
            <option value="M15">M15</option>
          </select>
        </label>
        <Field label="Plataforma" name="platform" placeholder="Quotex, Pocket Option..." />
        <Field label="Segundos da vela atual" name="secondsElapsed" type="number" placeholder="0 a 60" />
        <label className="grid gap-2 text-sm text-[#d4d4d8]">
          Notícia
          <select name="newsDeclaration" className="field" defaultValue="UNKNOWN">
            <option value="UNKNOWN">Não informado</option>
            <option value="FREE">Livre</option>
            <option value="ATTENTION">Atenção</option>
            <option value="BLOCKED">Bloqueio de alto impacto</option>
          </select>
        </label>
      </div>
      {error ? <p className="text-sm text-rose-200">{error}</p> : null}
      <button type="submit" disabled={pending} className="btn-accent w-fit">
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
    <label className="grid gap-2 text-sm text-[#d4d4d8]">
      {label}
      <input name={name} type={type} required={required} placeholder={placeholder} className="field" />
    </label>
  );
}

async function shrinkScreenshot(file: File): Promise<File> {
  const bitmap = await createImageBitmap(file);
  const max = 1200;
  const scale = Math.min(1, max / Math.max(bitmap.width, bitmap.height));
  const width = Math.max(1, Math.round(bitmap.width * scale));
  const height = Math.max(1, Math.round(bitmap.height * scale));
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext("2d");
  if (!context) {
    bitmap.close();
    return file;
  }
  context.drawImage(bitmap, 0, 0, width, height);
  bitmap.close();
  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/png"));
  if (!blob) return file;
  return new File([blob], "grafico.png", { type: "image/png" });
}

function UploadIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M12 16V5m0 0 4 4M12 5 8 9" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M5 16.5V18a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-1.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}
