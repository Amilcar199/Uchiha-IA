import Link from "next/link";
import { logoutAction } from "@/components/ui/logout-button";

const LINKS = [
  { href: "/dashboard", label: "Painel" },
  { href: "/analyze", label: "Analisar" },
  { href: "/analyses", label: "Histórico" },
  { href: "/settings", label: "Parâmetros" },
];

export function AppShell({ name, children }: { name: string; children: React.ReactNode }) {
  return (
    <div className="min-h-screen">
      <header className="border-b border-[#2c3444]">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-4 py-4 md:px-6">
          <div>
            <Link href="/dashboard" className="text-sm font-semibold tracking-[0.18em]">
              UCHIHA IA
            </Link>
            <p className="text-xs text-[#a8a29e]">Leitura de preço. Sem execução de ordens.</p>
          </div>
          <nav className="flex flex-wrap items-center gap-4 text-sm text-[#d6d3d1]">
            {LINKS.map((link) => (
              <Link key={link.href} href={link.href} className="hover:text-white">
                {link.label}
              </Link>
            ))}
            <span className="text-[#a8a29e]">{name}</span>
            <form action={logoutAction}>
              <button type="submit" className="text-[#a8a29e] hover:text-white">
                Sair
              </button>
            </form>
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-8 md:px-6">{children}</main>
    </div>
  );
}
