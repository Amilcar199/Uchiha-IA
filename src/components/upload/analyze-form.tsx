"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { parsePrintText } from "@/engines/vision/print-text";

export function AnalyzeForm() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [status, setStatus] = useState("Analisar print");
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
    const timer = window.setTimeout(() => controller.abort(), 70000);
    try {
      setStatus("A preparar a captura...");
      const image = await shrinkScreenshot(file);
      setStatus("A ler o par e o tempo no print...");
      const context = parsePrintText(await readPrintText(image));
      setStatus("A aplicar a Lógica do Preço...");
      const body = new FormData();
      body.set("image", image);
      if (context.asset) body.set("asset", context.asset);
      if (context.timeframe) body.set("timeframe", context.timeframe);
      if (context.regime) body.set("marketRegime", context.regime);
      if (context.platform) body.set("platform", context.platform);
      body.set("newsDeclaration", "UNKNOWN");
      const response = await fetch("/api/analyses", {
        method: "POST",
        body,
        signal: controller.signal,
      });
      const raw = await response.text();
      const payload = parsePayload(raw);
      if (!response.ok || !payload?.id) {
        setError(payload?.error?.message ?? readableFailure(raw, response.status));
        return;
      }
      router.push(`/analyses/${payload.id}`);
      router.refresh();
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") {
        setError("A leitura demorou demais. Envie a captura outra vez.");
        return;
      }
      setError("Não consegui abrir essa captura. Use PNG ou JPG do gráfico.");
    } finally {
      window.clearTimeout(timer);
      setPending(false);
      setStatus("Analisar print");
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
        <span className="mt-2 max-w-md text-sm text-[#9aa3b2]">
          Arraste, escolha o ficheiro ou cole com Ctrl+V. O par e o tempo são lidos da imagem.
        </span>
        <input
          name="image"
          type="file"
          accept="image/png,image/jpeg,image/webp"
          required={!file}
          className="sr-only"
          onChange={(event) => takeFile(event.target.files?.[0] ?? null)}
        />
      </label>
      {error ? <p className="text-sm text-rose-200">{error}</p> : null}
      <button type="submit" disabled={pending} className="btn-accent w-fit">
        {pending ? status : "Analisar print"}
      </button>
    </form>
  );
}

function parsePayload(raw: string): { id?: string; error?: { message?: string } } | null {
  try {
    return JSON.parse(raw) as { id?: string; error?: { message?: string } };
  } catch {
    return null;
  }
}

function readableFailure(raw: string, status: number): string {
  const text = raw.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
  if (text.length > 0) return text.slice(0, 180);
  return `A leitura falhou (${status}). Envia o print outra vez.`;
}

async function readPrintText(file: File): Promise<string> {
  try {
    const { createWorker } = await import("tesseract.js");
    const worker = await createWorker("eng");
    try {
      const result = await Promise.race([
        worker.recognize(file),
        new Promise<null>((resolve) => window.setTimeout(() => resolve(null), 12000)),
      ]);
      return result && "data" in result ? result.data.text : "";
    } finally {
      await worker.terminate();
    }
  } catch {
    return "";
  }
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
    throw new Error("Não foi possível reduzir a captura.");
  }
  context.drawImage(bitmap, 0, 0, width, height);
  bitmap.close();
  let quality = 0.85;
  let blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/jpeg", quality));
  while (blob && blob.size > 1_500_000 && quality > 0.5) {
    quality -= 0.15;
    blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/jpeg", quality));
  }
  if (!blob) throw new Error("Não foi possível reduzir a captura.");
  return new File([blob], "grafico.jpg", { type: "image/jpeg" });
}

function UploadIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M12 16V5m0 0 4 4M12 5 8 9" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M5 16.5V18a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-1.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}
