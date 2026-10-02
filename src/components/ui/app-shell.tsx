import Link from "next/link";
import { AppNav } from "@/components/ui/app-nav";
import { logoutAction } from "@/components/ui/logout-button";

export function AppShell({ name, children }: { name: string; children: React.ReactNode }) {
  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-20 border-b border-white/8 bg-[#05070c]/75 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-4 py-3 md:px-6">
          <Link href="/dashboard" className="flex items-center gap-2.5">
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#ff2d4a] shadow-[0_0_24px_rgba(255,45,74,0.45)]">
              <span className="h-2.5 w-2.5 rounded-full bg-white" />
            </span>
            <span>
              <span className="block text-sm font-semibold tracking-[0.16em]">UCHIHA</span>
              <span className="block text-[11px] text-[#9aa3b2]">Leitura de preço</span>
            </span>
          </Link>
          <div className="flex flex-wrap items-center gap-3">
            <AppNav />
            <span className="hidden text-sm text-[#9aa3b2] sm:inline">{name}</span>
            <form action={logoutAction}>
              <button type="submit" className="text-sm text-[#9aa3b2] hover:text-white">
                Sair
              </button>
            </form>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-10 md:px-6">{children}</main>
    </div>
  );
}
