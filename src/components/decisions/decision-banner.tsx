import type { DecisionState } from "@/domain/decisions/types";

const LABEL: Record<DecisionState, string> = {
  OPERAR_COMPRA: "Operar compra",
  OPERAR_VENDA: "Operar venda",
  AGUARDAR: "Aguardar",
  NAO_OPERAR: "Não operar",
};

const TONE: Record<DecisionState, string> = {
  OPERAR_COMPRA: "border-emerald-400/30 bg-emerald-400/10 text-emerald-50 shadow-[0_0_80px_rgba(16,185,129,0.12)]",
  OPERAR_VENDA: "border-rose-400/30 bg-rose-500/10 text-rose-50 shadow-[0_0_80px_rgba(244,63,94,0.14)]",
  AGUARDAR: "border-amber-300/30 bg-amber-300/10 text-amber-50 shadow-[0_0_80px_rgba(251,191,36,0.1)]",
  NAO_OPERAR: "border-white/10 bg-white/[0.04] text-[#f4f4f5]",
};

export function DecisionBanner({
  state,
  confidence,
}: {
  state: DecisionState;
  confidence: "baixa" | "media" | "alta";
}) {
  return (
    <section className={`rounded-[1.6rem] border px-6 py-7 ${TONE[state]}`}>
      <p className="text-xs font-semibold tracking-[0.2em] uppercase opacity-80">Decisão</p>
      <h2 className="mt-2 text-4xl font-semibold tracking-tight">{LABEL[state]}</h2>
      <p className="mt-3 max-w-2xl text-sm leading-6 opacity-90">
        Confiança da leitura: {confidence}. Isto descreve a clareza da análise, não a probabilidade de ganho.
      </p>
    </section>
  );
}

export function decisionLabel(state: DecisionState): string {
  return LABEL[state];
}
