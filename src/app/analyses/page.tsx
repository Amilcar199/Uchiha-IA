import Link from "next/link";
import { redirect } from "next/navigation";
import { decisionLabel } from "@/components/decisions/decision-banner";
import { AppShell } from "@/components/ui/app-shell";
import { getCurrentUser } from "@/lib/auth/session";
import { listAnalyses } from "@/repositories/analysis.repository";

interface HistoryPageProps {
  searchParams: Promise<Record<string, string | undefined>>;
}

export default async function HistoryPage({ searchParams }: HistoryPageProps) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  const filters = await searchParams;
  const analyses = await listAnalyses(user, {
    asset: filters.asset,
    timeframe: filters.timeframe,
    regime: filters.regime,
    cycle: filters.cycle,
    decision: filters.decision,
    from: filters.from,
    to: filters.to,
  });

  return (
    <AppShell name={user.name}>
      <p className="eyebrow">Arquivo</p>
      <h1 className="mt-3 text-4xl font-semibold tracking-tight">Histórico</h1>
      <form className="surface mt-6 grid gap-3 p-4 md:grid-cols-4">
        <input name="asset" defaultValue={filters.asset} placeholder="Ativo" className="field text-sm" />
        <select name="timeframe" defaultValue={filters.timeframe ?? ""} className="field text-sm">
          <option value="">Timeframe</option>
          <option value="M1">M1</option>
          <option value="M5">M5</option>
          <option value="M15">M15</option>
        </select>
        <select name="regime" defaultValue={filters.regime ?? ""} className="field text-sm">
          <option value="">Regime</option>
          <option value="REAL">Real</option>
          <option value="OTC">OTC</option>
        </select>
        <select name="decision" defaultValue={filters.decision ?? ""} className="field text-sm">
          <option value="">Decisão</option>
          <option value="OPERAR_COMPRA">Operar compra</option>
          <option value="OPERAR_VENDA">Operar venda</option>
          <option value="AGUARDAR">Aguardar</option>
          <option value="NAO_OPERAR">Não operar</option>
        </select>
        <input name="cycle" defaultValue={filters.cycle} placeholder="Ciclo" className="field text-sm" />
        <input name="from" type="date" defaultValue={filters.from?.slice(0, 10)} className="field text-sm" />
        <input name="to" type="date" defaultValue={filters.to?.slice(0, 10)} className="field text-sm" />
        <button className="btn-ghost">Filtrar</button>
      </form>

      <div className="surface mt-6 divide-y divide-white/8">
        {analyses.map((analysis) => (
          <Link key={analysis.id} href={`/analyses/${analysis.id}`} className="grid gap-1 px-5 py-4 transition hover:bg-white/[0.03] md:grid-cols-5">
            <span className="font-medium">{analysis.asset}</span>
            <span className="text-[#9aa3b2]">{analysis.marketRegime}</span>
            <span className="text-[#9aa3b2]">{analysis.timeframe}</span>
            <span>{decisionLabel(analysis.decision)}</span>
            <span className="text-[#9aa3b2]">{analysis.ruleVersion}</span>
          </Link>
        ))}
        {analyses.length === 0 ? <p className="px-5 py-8 text-sm text-[#9aa3b2]">Nenhuma análise com estes filtros.</p> : null}
      </div>
    </AppShell>
  );
}
