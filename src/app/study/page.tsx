import Link from "next/link";
import { redirect } from "next/navigation";
import { AppShell } from "@/components/ui/app-shell";
import { getCurrentUser } from "@/lib/auth/session";

export default async function StudyPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  return (
    <AppShell name={user.name}>
      <p className="eyebrow">Depois</p>
      <h1 className="mt-3 text-4xl font-semibold tracking-tight">Modo estudo</h1>
      <p className="mt-4 max-w-2xl text-sm leading-7 text-[#9aa3b2]">
        O modo estudo, o replay sem velas futuras, o calendário económico e as métricas ficam para depois da fundação. A leitura atual já explica ciclo, marcações, confluências e o que falta para uma entrada.
      </p>
      <Link href="/analyze" className="btn-primary mt-8">
        Ir para uma análise
      </Link>
    </AppShell>
  );
}
