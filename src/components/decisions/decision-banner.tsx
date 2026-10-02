import type { DecisionState } from "@/domain/decisions/types";

const LABEL: Record<DecisionState, string> = {
  OPERAR_COMPRA: "Operar compra",
  OPERAR_VENDA: "Operar venda",
  AGUARDAR: "Aguardar",
  NAO_OPERAR: "Não operar",
};

const TONE: Record<DecisionState, string> = {
  OPERAR_COMPRA: "border-emerald-700 bg-emerald-950/40 text-emerald-100",
  OPERAR_VENDA: "border-rose-800 bg-rose-950/40 text-rose-100",
  AGUARDAR: "border-amber-700 bg-amber-950/30 text-amber-100",
  NAO_OPERAR: "border-[#3f3f46] bg-[#18181b] text-[#e7e5e4]",
};

export function DecisionBanner({
  state,
  confidence,
}: {
  state: DecisionState;
  confidence: "baixa" | "media" | "alta";
}) {
  return (
    <section className={`border px-5 py-6 ${TONE[state]}`}>
      <p className="text-xs tracking-[0.16em] uppercase">Decisão</p>
      <h2 className="mt-2 text-3xl font-semibold">{LABEL[state]}</h2>
      <p className="mt-3 max-w-2xl text-sm leading-6">
        Confiança da leitura: {confidence}. Isto descreve a clareza da análise, não a probabilidade de ganho.
      </p>
    </section>
  );
}

export function decisionLabel(state: DecisionState): string {
  return LABEL[state];
}
