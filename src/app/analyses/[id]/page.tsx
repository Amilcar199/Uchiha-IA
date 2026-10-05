import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { DiagnosisReport } from "@/components/analysis/diagnosis-report";
import { ReadingCard } from "@/components/analysis/reading-card";
import { buildReadingCard } from "@/engines/decision/reading-card";
import { OutcomeForm } from "@/components/analysis/outcome-form";
import { ChartOverlay, MARKING_LABEL } from "@/components/chart/chart-overlay";
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
  const markings = result.markings ?? [];
  const card = buildReadingCard({
    state: record.decision,
    confidence: record.confidence,
    cycle: result.context?.cycle ?? null,
    trend: result.context?.trend ?? "INDEFINIDA",
    markings,
    confluences: result.confluences ?? [],
    missing: result.decision?.missingConditions ?? [],
    conflicts: result.conflicts ?? [],
  });

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
          markings={card.overlay.length > 0 ? card.overlay : markings.slice(-6)}
          region={result.vision?.chartRegion ?? null}
          imageWidth={result.vision?.validation.width ?? 0}
          imageHeight={result.vision?.validation.height ?? 0}
        />
      ) : null}

      <div className="mt-6">
        <ReadingCard
          asset={record.asset}
          timeframe={record.timeframe}
          regime={record.marketRegime}
          state={record.decision}
          confidence={record.confidence}
          cycle={result.context?.cycle ?? null}
          trend={result.context?.trend ?? "INDEFINIDA"}
          markings={markings}
          confluences={result.confluences ?? []}
          missing={result.decision?.missingConditions ?? []}
          conflicts={result.conflicts ?? []}
        />
      </div>

      <DiagnosisReport
        asset={record.asset}
        timeframe={record.timeframe}
        regime={record.marketRegime}
        cycle={result.context?.cycle ?? null}
        trend={result.context?.trend ?? "INDEFINIDA"}
        state={record.decision}
        newsStatus={result.news?.status ?? "UNKNOWN"}
        timingConfirmed={Boolean(result.timing?.confirmed)}
        markings={markings}
        confluences={result.confluences ?? []}
        conflicts={result.conflicts ?? []}
        missing={result.decision?.missingConditions ?? []}
        candleCount={candles.length}
        imageAccepted={result.vision ? result.vision.validation.accepted : candles.length > 0}
      />

      <section className="surface mt-4 p-5">
        <h2 className="text-sm font-medium">Marcações</h2>
        <ul className="mt-3 grid gap-2 text-sm">
          {result.markings.length === 0 ? <li className="text-[#9aa3b2]">Nenhuma marcação confirmada neste print.</li> : null}
          {result.markings.map((marking) => (
            <li key={`${marking.type}-${marking.candleIndex}-${marking.level}`}>
              {MARKING_LABEL[marking.type] ?? marking.type}
              {typeof marking.metadata.name === "string" ? ` · ${marking.metadata.name}` : ""}
              {marking.direction ? ` · ${marking.direction}` : ""}
              {marking.level != null ? ` · nível ${marking.level.toFixed(4)}` : ""}
              {marking.candleIndex != null ? ` · vela ${marking.candleIndex}` : ""}
            </li>
          ))}
        </ul>
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

