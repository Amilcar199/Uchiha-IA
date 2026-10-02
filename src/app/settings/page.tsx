import { redirect } from "next/navigation";
import { defaultRuleParameters, parameterStatus } from "@/config/rule-parameters";
import { AppShell } from "@/components/ui/app-shell";
import { getCurrentUser } from "@/lib/auth/session";

const LABELS: Record<string, string> = {
  longWickRatio: "Pavio longo",
  smallWickRatio: "Pavio pequeno",
  defenseDistanceRatio: "Espaço até a defesa",
  proximityTolerance: "Proximidade da defesa",
  newsBlockWindowMinutes: "Janela de notícia",
  first15SecondsRule: "Regra dos 15 segundos fora do M1",
};

export default async function SettingsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  const status = parameterStatus(defaultRuleParameters);

  return (
    <AppShell name={user.name}>
      <p className="eyebrow">Regras</p>
      <h1 className="mt-3 text-4xl font-semibold tracking-tight">Parâmetros</h1>
      <p className="mt-4 max-w-2xl text-sm leading-7 text-[#9aa3b2]">
        Enquanto um valor estiver pendente, o motor não inventa um número. A alteração por administrador, com auditoria, fica para a fase de governança.
      </p>
      <div className="surface mt-8 divide-y divide-white/8">
        {Object.entries(status).map(([key, value]) => (
          <div key={key} className="flex items-center justify-between gap-4 px-5 py-4 text-sm">
            <span>{LABELS[key] ?? key}</span>
            <span className={value === "PENDING_MENTOR_VALIDATION" ? "rounded-full bg-amber-300/10 px-3 py-1 text-amber-100" : "rounded-full bg-emerald-400/10 px-3 py-1 text-emerald-100"}>
              {value === "PENDING_MENTOR_VALIDATION" ? "Pendente de validação" : "Validado"}
            </span>
          </div>
        ))}
      </div>
      <p className="mt-6 text-sm text-[#9aa3b2]">
        Versão atual das regras: {defaultRuleParameters.version}. Análises antigas continuam presas à versão com que foram gravadas.
      </p>
    </AppShell>
  );
}
