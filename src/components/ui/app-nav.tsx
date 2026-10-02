"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const LINKS = [
  { href: "/dashboard", label: "Painel" },
  { href: "/analyze", label: "Analisar" },
  { href: "/analyses", label: "Histórico" },
  { href: "/settings", label: "Parâmetros" },
];

export function AppNav() {
  const pathname = usePathname();

  return (
    <nav className="flex flex-wrap items-center gap-1 rounded-full border border-white/10 bg-white/[0.03] p-1">
      {LINKS.map((link) => {
        const active = pathname === link.href || pathname.startsWith(`${link.href}/`);
        return (
          <Link
            key={link.href}
            href={link.href}
            className={
              active
                ? "rounded-full bg-white px-3.5 py-1.5 text-sm font-medium text-[#09090b]"
                : "rounded-full px-3.5 py-1.5 text-sm text-[#d4d4d8] hover:bg-white/8 hover:text-white"
            }
          >
            {link.label}
          </Link>
        );
      })}
    </nav>
  );
}
