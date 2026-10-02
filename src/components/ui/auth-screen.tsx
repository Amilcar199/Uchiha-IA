import Link from "next/link";
import { AuthForm } from "@/components/ui/auth-form";

export function AuthScreen({ mode }: { mode: "login" | "register" }) {
  return (
    <main className="mx-auto grid min-h-screen max-w-6xl items-center gap-12 px-4 py-10 lg:grid-cols-[1.15fr_0.85fr] lg:px-6">
      <section>
        <p className="eyebrow">Lógica do preço</p>
        <h1 className="mt-4 max-w-xl text-5xl font-semibold leading-[1.05] tracking-tight sm:text-6xl">
          Envie o gráfico.
          <span className="mt-1 block bg-gradient-to-r from-white to-[#ff8a98] bg-clip-text text-transparent">
            Receba a leitura.
          </span>
        </h1>
        <p className="mt-5 max-w-lg text-base leading-7 text-[#9aa3b2]">
          O Uchiha lê ciclo, tendência, marcações e confluência a partir do print. A decisão de entrar continua a ser sua. Não há execução de ordens.
        </p>
        <ul className="mt-8 flex max-w-lg flex-wrap gap-2 text-sm text-[#d4d4d8]">
          <li className="surface px-4 py-2">Ciclo e tendência</li>
          <li className="surface px-4 py-2">Marcações no print</li>
          <li className="surface px-4 py-2">Aguarda sem contexto</li>
        </ul>
      </section>
      <section className="mx-auto w-full max-w-md">
        <AuthForm mode={mode} />
        <p className="mt-4 text-center text-sm text-[#9aa3b2]">
          {mode === "login" ? (
            <>
              Sem conta?{" "}
              <Link href="/register" className="text-white underline-offset-4 hover:underline">
                Criar conta
              </Link>
            </>
          ) : (
            <>
              Já tem conta?{" "}
              <Link href="/login" className="text-white underline-offset-4 hover:underline">
                Entrar
              </Link>
            </>
          )}
        </p>
      </section>
    </main>
  );
}
