import { redirect } from "next/navigation";
import { ReadingCardView } from "@/components/analysis/reading-card";
import { AnalyzeForm } from "@/components/upload/analyze-form";
import { AppShell } from "@/components/ui/app-shell";
import { getCurrentUser } from "@/lib/auth/session";

export default async function AnalyzePage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  return (
    <AppShell name={user.name}>
      <p className="eyebrow">Nova leitura</p>
      <h1 className="mt-3 max-w-3xl text-4xl font-semibold tracking-tight sm:text-6xl">Solte o print. Receba o cartão.</h1>
      <p className="mt-4 max-w-2xl text-sm leading-7 text-[#9aa3b2]">
        O resultado traz direção, marcação, nível, defesa, alvo e os motivos. Tudo sai da Lógica do Preço. Se o print não confirmar uma condição, o cartão diz aguardar.
      </p>
      <div className="mt-8 max-w-3xl">
        <AnalyzeForm />
      </div>
      <div className="mt-10 max-w-3xl">
        <p className="mb-3 text-xs tracking-[0.16em] text-[#9aa3b2] uppercase">Exemplo de cartão · não é uma operação</p>
        <ReadingCardView
          asset="EUR/USD"
          timeframe="M1"
          regime="REAL"
          model={{
            tone: "wait",
            headline: "AGUARDAR",
            sentence: "Há comando de compra dentro da correção, mas o espaço até a defesa não foi confirmado.",
            confidence: "Média",
            marking: "Comando",
            level: "abertura da vela",
            defense: "Não confirmada neste print",
            target: "Alvo de liquidez do micro lote",
            reasons: ["O ciclo admite retração.", "A vela de comando está no lado da compra.", "A tendência dos topos e fundos é de alta."],
            pending: ["Espaço até a próxima defesa", "Os 15 segundos da vela atual"],
            overlay: [],
          }}
        />
      </div>
    </AppShell>
  );
}
