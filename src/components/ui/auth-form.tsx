"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function AuthForm({ mode }: { mode: "login" | "register" }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError(null);
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
    router.push("/dashboard");
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="grid w-full max-w-md gap-4 border border-[#2c3444] bg-[#171d27] p-6">
      <div>
        <p className="text-xs tracking-[0.18em]">UCHIHA IA</p>
        <h1 className="mt-2 text-2xl font-semibold">{mode === "login" ? "Entrar" : "Criar conta"}</h1>
      </div>
      {mode === "register" ? <Input name="name" label="Nome" required /> : null}
      <Input name="email" label="E-mail" type="email" required />
      <Input name="password" label="Palavra-passe" type="password" required />
      {error ? <p className="text-sm text-rose-200">{error}</p> : null}
      <button type="submit" disabled={pending} className="bg-[#e7e5e4] px-4 py-2 text-sm font-medium text-[#10141b] disabled:opacity-60">
        {pending ? "A guardar..." : mode === "login" ? "Entrar" : "Criar conta"}
      </button>
    </form>
  );
}

function Input({ name, label, type = "text", required }: { name: string; label: string; type?: string; required?: boolean }) {
  return (
    <label className="grid gap-2 text-sm">
      {label}
      <input name={name} type={type} required={required} className="border border-[#2c3444] bg-[#10141b] px-3 py-2 outline-none" />
    </label>
  );
}
