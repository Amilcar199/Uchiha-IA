import { redirect } from "next/navigation";
import { AnalyzeForm } from "@/components/upload/analyze-form";
import { AppShell } from "@/components/ui/app-shell";
import { getCurrentUser } from "@/lib/auth/session";

export default async function AnalyzePage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  return (
    <AppShell name={user.name}>
      <h1 className="text-2xl font-semibold">Analisar gráfico</h1>
      <p className="mt-2 max-w-2xl text-sm leading-6 text-[#a8a29e]">
        Envie o print da plataforma que vai operar. No OTC, esse print é a fonte da leitura. O TradingView não substitui o gráfico da corretora e não é consultado por aqui.
      </p>
      <div className="mt-8 max-w-3xl">
        <AnalyzeForm />
      </div>
    </AppShell>
  );
}
