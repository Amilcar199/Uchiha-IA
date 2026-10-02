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
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Painel</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-[#a8a29e]">
            A ferramenta sugere e explica. A entrada continua a ser sua. Não há execução automática.
          </p>
        </div>
        <Link href="/analyze" className="bg-[#e7e5e4] px-4 py-2 text-sm font-medium text-[#10141b]">
          Analisar novo gráfico
        </Link>
      </div>

      <dl className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="Aguardar" value={counts.AGUARDAR} />
        <Stat label="Operar compra" value={counts.OPERAR_COMPRA} />
        <Stat label="Operar venda" value={counts.OPERAR_VENDA} />
        <Stat label="Não operar" value={counts.NAO_OPERAR} />
      </dl>

      <section className="mt-10">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-medium">Análises recentes</h2>
          <Link href="/analyses" className="text-sm text-[#d6d3d1]">
            Histórico
          </Link>
        </div>
        <div className="mt-4 divide-y divide-[#2c3444] border border-[#2c3444]">
          {analyses.slice(0, 6).map((analysis) => (
            <Link key={analysis.id} href={`/analyses/${analysis.id}`} className="grid gap-1 px-4 py-3 hover:bg-[#171d27] md:grid-cols-4">
              <span>{analysis.asset}</span>
              <span className="text-[#a8a29e]">{analysis.timeframe} · {analysis.marketRegime}</span>
              <span>{decisionLabel(analysis.decision)}</span>
              <span className="text-[#a8a29e]">{new Date(analysis.createdAt).toLocaleString("pt-BR")}</span>
            </Link>
          ))}
          {analyses.length === 0 ? <p className="px-4 py-6 text-sm text-[#a8a29e]">Ainda não há análises.</p> : null}
        </div>
      </section>

      <p className="mt-8 text-sm text-[#a8a29e]">
        O modo estudo entra numa fase seguinte. <Link href="/study">Ver o que fica para depois.</Link>
      </p>
    </AppShell>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="border border-[#2c3444] px-4 py-3">
      <dt className="text-sm text-[#a8a29e]">{label}</dt>
      <dd className="mt-1 text-2xl font-semibold">{value}</dd>
    </div>
  );
}
