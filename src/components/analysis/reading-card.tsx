import { buildReadingCard, type ReadingCardModel } from "@/engines/decision/reading-card";

const TONE: Record<ReadingCardModel["tone"], string> = {
  buy: "border-emerald-400/25 bg-emerald-400/[0.06]",
  sell: "border-[#ff2d4a]/30 bg-[#ff2d4a]/[0.07]",
  wait: "border-amber-300/25 bg-amber-300/[0.06]",
  block: "border-white/10 bg-white/[0.03]",
};

const HEADLINE: Record<ReadingCardModel["tone"], string> = {
  buy: "text-emerald-300",
  sell: "text-[#ff5a6e]",
  wait: "text-amber-200",
  block: "text-white",
};

export function ReadingCardView({
  model,
  asset,
  timeframe,
  regime,
}: {
  model: ReadingCardModel;
  asset: string;
  timeframe: string;
  regime: string;
}) {
  return (
    <section className={`rounded-[1.6rem] border p-6 sm:p-7 ${TONE[model.tone]}`}>
      <p className="text-xs tracking-[0.16em] text-[#9aa3b2] uppercase">
        {asset === "NAO LIDO" ? "Par não lido no print" : asset}
        {" · "}
        {timeframe === "NAO LIDO" ? "Tempo não lido no print" : timeframe}
        {regime === "OTC" ? " · OTC" : ""}
      </p>
      <div className="mt-3 flex flex-wrap items-end justify-between gap-4">
        <h2 className={`text-5xl font-semibold tracking-tight ${HEADLINE[model.tone]}`}>{model.headline}</h2>
        <div className="text-right">
          <p className="text-3xl font-semibold">{model.confidence}</p>
          <p className="text-xs text-[#9aa3b2]">Clareza da leitura</p>
        </div>
      </div>
      <p className="mt-4 max-w-2xl text-sm leading-6 text-[#d4d4d8]">{model.sentence}</p>

      <dl className="mt-6 grid gap-4 border-t border-white/10 pt-5 sm:grid-cols-4">
        <Slot label="Marcação" value={model.marking} />
        <Slot label="Nível no print" value={model.level} />
        <Slot label="Defesa" value={model.defense} />
        <Slot label="Alvo" value={model.target} />
      </dl>

      <div className="mt-6 grid gap-5 lg:grid-cols-2">
        <div>
          <h3 className="text-xs font-semibold tracking-[0.16em] text-[#9aa3b2] uppercase">Porquê</h3>
          <ul className="mt-3 grid gap-2 text-sm leading-6">
            {model.reasons.length === 0 ? <li className="text-[#9aa3b2]">Ainda não há confluências independentes.</li> : null}
            {model.reasons.map((reason) => (
              <li key={reason}>• {reason}</li>
            ))}
          </ul>
        </div>
        <div>
          <h3 className="text-xs font-semibold tracking-[0.16em] text-[#9aa3b2] uppercase">Ainda não confirmado</h3>
          <ul className="mt-3 grid gap-2 text-sm leading-6">
            {model.pending.length === 0 ? <li className="text-[#9aa3b2]">Nada ficou em aberto nesta leitura.</li> : null}
            {model.pending.map((item) => (
              <li key={item}>• {item}</li>
            ))}
          </ul>
        </div>
      </div>
      <p className="mt-5 text-xs leading-5 text-[#9aa3b2]">
        A clareza descreve a leitura, não a chance de ganho. O livro não define stop, take profit nem uma relação risco/retorno numérica.
      </p>
    </section>
  );
}

export function ReadingCard(input: Parameters<typeof buildReadingCard>[0] & { asset: string; timeframe: string; regime: string }) {
  const model = buildReadingCard(input);
  return <ReadingCardView model={model} asset={input.asset} timeframe={input.timeframe} regime={input.regime} />;
}

function Slot({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs text-[#9aa3b2]">{label}</dt>
      <dd className="mt-1 text-sm font-medium leading-5">{value}</dd>
    </div>
  );
}
