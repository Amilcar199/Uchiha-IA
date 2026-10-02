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
      <h1 className="mt-3 max-w-2xl text-4xl font-semibold tracking-tight sm:text-5xl">Solte o print. A leitura sai estruturada.</h1>
      <p className="mt-4 max-w-2xl text-sm leading-7 text-[#9aa3b2]">
        Envie o print da plataforma que vai operar. No OTC, esse print é a fonte da leitura. O TradingView não substitui o gráfico da corretora e não é consultado por aqui.
      </p>
      <div className="mt-8 max-w-3xl">
        <AnalyzeForm />
      </div>
    </AppShell>
  );
}
