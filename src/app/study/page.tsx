import Link from "next/link";
import { redirect } from "next/navigation";
import { AppShell } from "@/components/ui/app-shell";
import { getCurrentUser } from "@/lib/auth/session";

export default async function StudyPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  return (
    <AppShell name={user.name}>
      <h1 className="text-2xl font-semibold">Modo estudo</h1>
      <p className="mt-3 max-w-2xl text-sm leading-6 text-[#a8a29e]">
        O modo estudo, o replay sem velas futuras, o calendário económico e as métricas ficam para depois da fundação. A leitura atual já explica ciclo, marcações, confluências e o que falta para uma entrada.
      </p>
      <Link href="/analyze" className="mt-6 inline-block text-sm underline">
        Ir para uma análise
      </Link>
    </AppShell>
  );
}
