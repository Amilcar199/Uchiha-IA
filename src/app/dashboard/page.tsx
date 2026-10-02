import Link from "next/link";
import { redirect } from "next/navigation";
import { AppShell } from "@/components/ui/app-shell";
import { decisionLabel } from "@/components/decisions/decision-banner";
import { getCurrentUser } from "@/lib/auth/session";
import { listAnalyses } from "@/repositories/analysis.repository";

export default async function DashboardPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  const analyses = await listAnalyses(user, {});
  const counts = {
    AGUARDAR: analyses.filter((item) => item.decision === "AGUARDAR").length,
    OPERAR_COMPRA: analyses.filter((item) => item.decision === "OPERAR_COMPRA").length,
    OPERAR_VENDA: analyses.filter((item) => item.decision === "OPERAR_VENDA").length,
    NAO_OPERAR: analyses.filter((item) => item.decision === "NAO_OPERAR").length,
  };

  return (
    <AppShell name={user.name}>
      <div className="flex flex-wrap items-end justify-between gap-6">
        <div>
          <p className="eyebrow">Painel</p>
          <h1 className="mt-3 max-w-2xl text-4xl font-semibold tracking-tight sm:text-5xl">A leitura fica aqui. A entrada continua sua.</h1>
          <p className="mt-4 max-w-xl text-sm leading-6 text-[#9aa3b2]">
            Cada análise explica ciclo, marcações e o que ainda falta. Não há execução automática.
          </p>
        </div>
        <Link href="/analyze" className="btn-accent">
          Analisar gráfico
        </Link>
      </div>

      <dl className="mt-10 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="Aguardar" value={counts.AGUARDAR} />
        <Stat label="Operar compra" value={counts.OPERAR_COMPRA} />
        <Stat label="Operar venda" value={counts.OPERAR_VENDA} />
        <Stat label="Não operar" value={counts.NAO_OPERAR} />
      </dl>

      <section className="mt-10">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-medium">Análises recentes</h2>
          <Link href="/analyses" className="text-sm text-[#d4d4d8] hover:text-white">
            Ver histórico
          </Link>
        </div>
        <div className="surface mt-4 divide-y divide-white/8">
          {analyses.slice(0, 6).map((analysis) => (
            <Link key={analysis.id} href={`/analyses/${analysis.id}`} className="grid gap-1 px-5 py-4 transition hover:bg-white/[0.03] md:grid-cols-4">
              <span className="font-medium">{analysis.asset}</span>
              <span className="text-[#9aa3b2]">{analysis.timeframe} · {analysis.marketRegime}</span>
              <span>{decisionLabel(analysis.decision)}</span>
              <span className="text-[#9aa3b2]">{new Date(analysis.createdAt).toLocaleString("pt-BR")}</span>
            </Link>
          ))}
          {analyses.length === 0 ? <p className="px-5 py-8 text-sm text-[#9aa3b2]">Ainda não há análises. O primeiro print abre o histórico.</p> : null}
        </div>
      </section>

      <p className="mt-8 text-sm text-[#9aa3b2]">
        O modo estudo entra numa fase seguinte.{" "}
        <Link href="/study" className="text-white underline-offset-4 hover:underline">
          Ver o que fica para depois.
        </Link>
      </p>
    </AppShell>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="surface px-5 py-4">
      <dt className="text-sm text-[#9aa3b2]">{label}</dt>
      <dd className="mt-2 text-3xl font-semibold tracking-tight">{value}</dd>
    </div>
  );
}
