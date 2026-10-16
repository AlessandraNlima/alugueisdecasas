"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import type { LucideIcon } from "lucide-react";
import {
  Building2,
  ChartColumn,
  ChevronRight,
  FileText,
  House,
  LogOut,
  Menu,
  Users,
  X,
} from "lucide-react";
import { signOut } from "@/app/login/actions";

const LINKS: { href: string; label: string; icone: LucideIcon }[] = [
  { href: "/", label: "Visão geral", icone: House },
  { href: "/imoveis", label: "Imóveis", icone: Building2 },
  { href: "/despesas", label: "Despesas", icone: FileText },
  { href: "/relatorio", label: "Relatórios", icone: ChartColumn },
  { href: "/usuarios", label: "Usuários", icone: Users },
];

function Logo() {
  return (
    <Link href="/" className="flex items-center gap-3">
      <House className="h-9 w-9 text-blue-600" strokeWidth={2.4} aria-hidden />
      <span className="leading-tight">
        <span className="block text-xl font-extrabold tracking-tight text-slate-900">Aluguéis</span>
        <span className="block text-[0.65rem] font-semibold uppercase tracking-[0.14em] text-slate-500">
          Gestão de imóveis
        </span>
      </span>
    </Link>
  );
}

export function BarraLateral({ email, nome }: { email: string; nome: string | null }) {
  const pathname = usePathname();
  const [aberto, setAberto] = useState(false);

  // Fecha o menu do celular ao trocar de página.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- reação à navegação
    setAberto(false);
  }, [pathname]);

  const ativo = (href: string) => (href === "/" ? pathname === "/" : pathname.startsWith(href));
  const inicial = (nome || email).trim().charAt(0).toUpperCase() || "?";

  const conteudo = (
    <div className="flex h-full flex-col">
      <div className="px-6 pb-8 pt-7">
        <Logo />
      </div>
      <nav aria-label="Menu principal" className="flex flex-col gap-1 px-4">
        {LINKS.map(({ href, label, icone: Icone }) => {
          const atual = ativo(href);
          return (
            <Link
              key={href}
              href={href}
              aria-current={atual ? "page" : undefined}
              className={`flex items-center gap-3 rounded-xl px-4 py-3 text-[0.95rem] font-medium transition-colors ${
                atual ? "bg-blue-50 text-blue-700" : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
              }`}
            >
              <Icone className={`h-5 w-5 ${atual ? "text-blue-600" : "text-slate-500"}`} aria-hidden />
              {label}
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto flex flex-col gap-1 border-t border-slate-100 p-4">
        <Link
          href="/minha-senha"
          title="Trocar minha senha"
          className={`flex items-center gap-3 rounded-xl px-3 py-2.5 transition-colors ${
            ativo("/minha-senha") ? "bg-blue-50" : "hover:bg-slate-50"
          }`}
        >
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-blue-100 text-base font-bold text-blue-700">
            {inicial}
          </span>
          <span className="min-w-0 flex-1">
            <span className="block text-sm font-semibold text-slate-900">Minha conta</span>
            <span className="block truncate text-xs text-slate-500">{nome || email}</span>
          </span>
          <ChevronRight className="h-4 w-4 text-slate-400" aria-hidden />
        </Link>
        <form action={signOut}>
          <button
            type="submit"
            className="flex w-full items-center gap-3 rounded-xl px-4 py-2.5 text-sm font-medium text-slate-500 transition-colors hover:bg-slate-50 hover:text-slate-900"
          >
            <LogOut className="h-4 w-4" aria-hidden />
            Sair
          </button>
        </form>
      </div>
    </div>
  );

  return (
    <>
      {/* Celular e tablet: barra no topo com botão de menu */}
      <header className="sticky top-0 z-30 flex items-center justify-between border-b border-slate-200/70 bg-white/90 px-4 py-3 backdrop-blur lg:hidden">
        <Logo />
        <button
          type="button"
          onClick={() => setAberto(true)}
          aria-label="Abrir menu"
          aria-expanded={aberto}
          className="grid h-10 w-10 place-items-center rounded-lg text-slate-700 hover:bg-slate-100"
        >
          <Menu className="h-6 w-6" aria-hidden />
        </button>
      </header>

      {aberto && (
        <div className="fixed inset-0 z-40 lg:hidden" role="dialog" aria-modal="true" aria-label="Menu">
          <button
            type="button"
            aria-label="Fechar menu"
            onClick={() => setAberto(false)}
            className="absolute inset-0 bg-slate-900/30 backdrop-blur-[2px]"
          />
          <aside className="absolute inset-y-0 left-0 w-72 max-w-[85vw] bg-white shadow-xl">
            <button
              type="button"
              onClick={() => setAberto(false)}
              aria-label="Fechar menu"
              className="absolute right-3 top-3 grid h-10 w-10 place-items-center rounded-lg text-slate-500 hover:bg-slate-100"
            >
              <X className="h-5 w-5" aria-hidden />
            </button>
            {conteudo}
          </aside>
        </div>
      )}

      {/* Computador: menu fixo à esquerda */}
      <aside className="fixed inset-y-0 left-0 z-20 hidden w-64 border-r border-slate-200/70 bg-white lg:block">
        {conteudo}
      </aside>
    </>
  );
}
