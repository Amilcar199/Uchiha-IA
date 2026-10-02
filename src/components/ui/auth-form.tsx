"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function AuthForm({ mode }: { mode: "login" | "register" }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError(null);
    setNotice(null);
    const form = new FormData(event.currentTarget);
    const response = await fetch(mode === "login" ? "/api/auth/login" : "/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: form.get("name"),
        email: form.get("email"),
        password: form.get("password"),
      }),
    });
    const payload = await response.json();
    setPending(false);
    if (!response.ok) {
      setError(payload.error?.message ?? "Não foi possível entrar.");
      return;
    }
    if (payload.needsConfirmation) {
      setNotice("Conta criada. Confirme o e-mail antes de entrar.");
      return;
    }
    router.push("/dashboard");
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="surface grid w-full gap-4 p-6 sm:p-7">
      <div>
        <p className="eyebrow">Conta</p>
        <h2 className="mt-2 text-2xl font-semibold tracking-tight">{mode === "login" ? "Entrar" : "Criar conta"}</h2>
      </div>
      {mode === "register" ? <Input name="name" label="Nome" required /> : null}
      <Input name="email" label="E-mail" type="email" required />
      <Input name="password" label="Palavra-passe" type="password" required />
      {notice ? <p className="text-sm text-emerald-200">{notice}</p> : null}
      {error ? <p className="text-sm text-rose-200">{error}</p> : null}
      <button type="submit" disabled={pending} className="btn-accent mt-1">
        {pending ? "A guardar..." : mode === "login" ? "Entrar" : "Criar conta"}
      </button>
    </form>
  );
}

function Input({ name, label, type = "text", required }: { name: string; label: string; type?: string; required?: boolean }) {
  return (
    <label className="grid gap-2 text-sm text-[#d4d4d8]">
      {label}
      <input name={name} type={type} required={required} className="field" />
    </label>
  );
}
