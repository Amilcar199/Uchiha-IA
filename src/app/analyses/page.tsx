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
      <h1 className="text-2xl font-semibold">Histórico</h1>
      <form className="mt-6 grid gap-3 md:grid-cols-4">
        <input name="asset" defaultValue={filters.asset} placeholder="Ativo" className="border border-[#2c3444] bg-transparent px-3 py-2 text-sm" />
        <select name="timeframe" defaultValue={filters.timeframe ?? ""} className="border border-[#2c3444] bg-[#10141b] px-3 py-2 text-sm">
          <option value="">Timeframe</option>
          <option value="M1">M1</option>
          <option value="M5">M5</option>
          <option value="M15">M15</option>
        </select>
        <select name="regime" defaultValue={filters.regime ?? ""} className="border border-[#2c3444] bg-[#10141b] px-3 py-2 text-sm">
          <option value="">Regime</option>
          <option value="REAL">Real</option>
          <option value="OTC">OTC</option>
        </select>
        <select name="decision" defaultValue={filters.decision ?? ""} className="border border-[#2c3444] bg-[#10141b] px-3 py-2 text-sm">
          <option value="">Decisão</option>
          <option value="OPERAR_COMPRA">Operar compra</option>
          <option value="OPERAR_VENDA">Operar venda</option>
          <option value="AGUARDAR">Aguardar</option>
          <option value="NAO_OPERAR">Não operar</option>
        </select>
        <input name="cycle" defaultValue={filters.cycle} placeholder="Ciclo" className="border border-[#2c3444] bg-transparent px-3 py-2 text-sm" />
        <input name="from" type="date" defaultValue={filters.from?.slice(0, 10)} className="border border-[#2c3444] bg-transparent px-3 py-2 text-sm" />
        <input name="to" type="date" defaultValue={filters.to?.slice(0, 10)} className="border border-[#2c3444] bg-transparent px-3 py-2 text-sm" />
        <button className="border border-[#2c3444] px-3 py-2 text-sm">Filtrar</button>
      </form>

      <div className="mt-6 divide-y divide-[#2c3444] border border-[#2c3444]">
        {analyses.map((analysis) => (
          <Link key={analysis.id} href={`/analyses/${analysis.id}`} className="grid gap-1 px-4 py-3 hover:bg-[#171d27] md:grid-cols-5">
            <span>{analysis.asset}</span>
            <span className="text-[#a8a29e]">{analysis.marketRegime}</span>
            <span className="text-[#a8a29e]">{analysis.timeframe}</span>
            <span>{decisionLabel(analysis.decision)}</span>
            <span className="text-[#a8a29e]">{analysis.ruleVersion}</span>
          </Link>
        ))}
        {analyses.length === 0 ? <p className="px-4 py-6 text-sm text-[#a8a29e]">Nenhuma análise com estes filtros.</p> : null}
      </div>
    </AppShell>
  );
}
