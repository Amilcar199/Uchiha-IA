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
      <h1 className="text-2xl font-semibold">Parâmetros</h1>
      <p className="mt-2 max-w-2xl text-sm leading-6 text-[#a8a29e]">
        Enquanto um valor estiver pendente, o motor não inventa um número. A alteração por administrador, com auditoria, fica para a fase de governança.
      </p>
      <div className="mt-6 divide-y divide-[#2c3444] border border-[#2c3444]">
        {Object.entries(status).map(([key, value]) => (
          <div key={key} className="flex items-center justify-between gap-4 px-4 py-3 text-sm">
            <span>{LABELS[key] ?? key}</span>
            <span className="text-[#a8a29e]">{value === "PENDING_MENTOR_VALIDATION" ? "Pendente de validação" : "Validado"}</span>
          </div>
        ))}
      </div>
      <p className="mt-6 text-sm text-[#a8a29e]">
        Versão atual das regras: {defaultRuleParameters.version}. Análises antigas continuam presas à versão com que foram gravadas.
      </p>
    </AppShell>
  );
}
