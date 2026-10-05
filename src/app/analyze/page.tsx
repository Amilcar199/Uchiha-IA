import { redirect } from "next/navigation";
import { AnalyzeForm } from "@/components/upload/analyze-form";
import { AppShell } from "@/components/ui/app-shell";
import { getCurrentUser } from "@/lib/auth/session";

export default async function AnalyzePage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  return (
    <AppShell name={user.name}>
      <p className="eyebrow">Nova leitura</p>
      <h1 className="mt-3 max-w-3xl text-4xl font-semibold tracking-tight sm:text-6xl">Solte o print. Receba o cartão.</h1>
      <p className="mt-4 max-w-2xl text-sm leading-7 text-[#9aa3b2]">
        O par, o tempo e as velas saem da captura. A direção segue a Lógica do Preço. O que a imagem não mostrar fica como não confirmado.
      </p>
      <div className="mt-8 max-w-3xl">
        <AnalyzeForm />
      </div>
    </AppShell>
  );
}
