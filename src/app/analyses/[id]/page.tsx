import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { OutcomeForm } from "@/components/analysis/outcome-form";
import { ChartOverlay } from "@/components/chart/chart-overlay";
import { DecisionBanner } from "@/components/decisions/decision-banner";
import { AppShell } from "@/components/ui/app-shell";
import { DeleteAnalysisButton } from "@/components/analysis/delete-analysis-button";
import { getCurrentUser } from "@/lib/auth/session";
import { AppError } from "@/lib/errors";
import { getAnalysis, listOutcomes } from "@/repositories/analysis.repository";

interface AnalysisPageProps {
  params: Promise<{ id: string }>;
}

export default async function AnalysisPage({ params }: AnalysisPageProps) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  const { id } = await params;

  let record;
  try {
    record = await getAnalysis(user, id);
  } catch (error) {
    if (error instanceof AppError && error.status === 404) notFound();
    throw error;
  }

  const outcomes = await listOutcomes(id);
  const result = record.result;
  const candles = result.vision?.candles ?? [];

  return (
    <AppShell name={user.name}>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm text-[#9aa3b2]">
            <Link href="/analyses" className="hover:text-white">
              Histórico
            </Link>
          </p>
          <h1 className="mt-2 text-4xl font-semibold tracking-tight">
            {record.asset} · {record.timeframe}
          </h1>
        </div>
        <DeleteAnalysisButton analysisId={record.id} />
      </div>

      {record.imagePath ? (
        <ChartOverlay
          imageUrl={`/api/analyses/${record.id}/image`}
          candles={candles}
          markings={result.markings}
          region={result.vision?.chartRegion ?? null}
          imageWidth={result.vision?.validation.width ?? 0}
          imageHeight={result.vision?.validation.height ?? 0}
        />
      ) : null}

      <div className="mt-6">
        <DecisionBanner state={record.decision} confidence={record.confidence} />
      </div>

      <section className="mt-6 grid gap-4 lg:grid-cols-2">
        <article className="surface p-5">
          <h2 className="text-sm font-medium">Contexto</h2>
          <dl className="mt-3 grid gap-2 text-sm">
            <Row label="Ciclo" value={result.context.cycle ?? "Não classificado"} />
            <Row label="Tendência" value={result.context.trend} />
            <Row label="Regime" value={record.marketRegime} />
            <Row label="Notícia" value={result.news.status} />
            <Row label="Gatilho" value={result.timing.confirmed ? "Confirmado na vela atual" : "Não confirmado"} />
            <Row label="Versão das regras" value={record.ruleVersion} />
          </dl>
        </article>
        <article className="surface p-5">
          <h2 className="text-sm font-medium">Confluências</h2>
          <ul className="mt-3 grid gap-2 text-sm">
            {result.confluences.length === 0 ? <li className="text-[#9aa3b2]">Nenhuma confluência independente.</li> : null}
            {result.confluences.map((item) => (
              <li key={`${item.family}-${item.type}`}>{item.evidence}</li>
            ))}
          </ul>
        </article>
      </section>

      <section className="surface mt-4 p-5">
        <h2 className="text-sm font-medium">Marcações</h2>
        <ul className="mt-3 grid gap-2 text-sm">
          {result.markings.length === 0 ? <li className="text-[#9aa3b2]">Nenhuma marcação da fase 1.</li> : null}
          {result.markings.map((marking) => (
            <li key={`${marking.type}-${marking.candleIndex}-${marking.level}`}>
              {marking.type}
              {marking.direction ? ` · ${marking.direction}` : ""}
              {marking.level != null ? ` · nível ${marking.level.toFixed(4)}` : ""}
              {marking.candleIndex != null ? ` · vela ${marking.candleIndex}` : ""}
            </li>
          ))}
        </ul>
      </section>

      <section className="surface mt-4 p-5">
        <h2 className="text-sm font-medium">Explicação</h2>
        <ol className="mt-3 grid list-decimal gap-2 pl-5 text-sm leading-6">
          {result.explanation.map((line) => (
            <li key={line}>{line}</li>
          ))}
        </ol>
      </section>

      <section className="mt-6">
        <OutcomeForm analysisId={record.id} />
        {outcomes.length > 0 ? (
          <ul className="mt-3 text-sm text-[#9aa3b2]">
            {outcomes.map((outcome) => (
              <li key={outcome.id}>
                {outcome.followed} · {outcome.result}
              </li>
            ))}
          </ul>
        ) : null}
      </section>

      <p className="mt-8 text-xs leading-5 text-[#9aa3b2]">
        Operar opções binárias pode levar à perda de todo o valor. Esta leitura não garante resultado. Os níveis estão na escala relativa do print quando o preço absoluto não está disponível.
      </p>
    </AppShell>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4">
      <dt className="text-[#9aa3b2]">{label}</dt>
      <dd>{value}</dd>
    </div>
  );
}
