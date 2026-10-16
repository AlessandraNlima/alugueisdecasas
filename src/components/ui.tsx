import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { nomeDoMes, somarMeses, type Situacao } from "@/lib/alugueis";

// Padrão visual do sistema: fundo claro, azul para ações e destaques, verde
// para recebimentos e saldo positivo, vermelho para despesas e atrasos.
// Cartões com cantos arredondados (rounded-2xl) e sombra suave.

export const sombra = "shadow-[0_1px_2px_rgba(15,23,42,0.04),0_8px_24px_-12px_rgba(15,23,42,0.10)]";

export const campo =
  "w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 shadow-sm placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20";
export const rotulo = "flex flex-col gap-1.5 text-sm font-medium text-slate-700";
export const botaoPrincipal =
  "inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm shadow-blue-600/25 transition-colors hover:bg-blue-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600";
export const botaoSecundario =
  "inline-flex items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition-colors hover:bg-slate-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600";
export const botaoDiscreto =
  "inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-xs font-medium text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900";
export const botaoPerigo =
  "inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-xs font-medium text-slate-500 transition-colors hover:bg-red-50 hover:text-red-700";

// Tabelas
// relative: prende o texto sr-only das colunas dentro da caixa de rolagem
export const tabelaCaixa = "relative overflow-x-auto rounded-xl border border-slate-100";
export const thead = "bg-slate-50/80";
export const th = "whitespace-nowrap px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500";
export const td = "px-4 py-3.5 align-middle";
export const tdValor = "whitespace-nowrap px-4 py-3.5 text-right tabular-nums";

export function CabecalhoPagina({
  secao,
  titulo,
  subtitulo,
  acoes,
}: {
  secao: string;
  titulo: string;
  subtitulo?: string;
  acoes?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
      <div className="min-w-0">
        <nav aria-label="Você está em" className="flex items-center gap-2 text-sm text-slate-500">
          <Link href="/" className="hover:text-slate-800">
            Painel
          </Link>
          <span aria-hidden>/</span>
          <span className="font-medium text-slate-800">{secao}</span>
        </nav>
        <h1 className="mt-2 text-2xl font-extrabold tracking-tight text-slate-900 text-balance sm:text-3xl">
          {titulo}
        </h1>
        {subtitulo && <p className="mt-1 text-base text-slate-500">{subtitulo}</p>}
      </div>
      {acoes && <div className="flex flex-col items-stretch gap-3 sm:flex-row sm:items-center lg:flex-col lg:items-end">{acoes}</div>}
    </div>
  );
}

export function Mensagem({ ok, erro }: { ok?: string; erro?: string }) {
  if (erro) {
    return (
      <p role="alert" className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
        {erro}
      </p>
    );
  }
  if (ok) {
    return (
      <p role="status" className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
        {ok}
      </p>
    );
  }
  return null;
}

const ESTILO_SITUACAO: Record<Situacao["tipo"], string> = {
  pago: "bg-emerald-50 text-emerald-700 ring-emerald-600/15",
  aberto: "bg-amber-50 text-amber-700 ring-amber-600/20",
  atrasado: "bg-red-50 text-red-700 ring-red-600/15",
  fora: "bg-slate-100 text-slate-600 ring-slate-500/10",
};

export function Etiqueta({ tipo, children }: { tipo: Situacao["tipo"]; children: React.ReactNode }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset ${ESTILO_SITUACAO[tipo]}`}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current" aria-hidden />
      {children}
    </span>
  );
}

export function NavegarMes({ caminho, mes }: { caminho: string; mes: string }) {
  const seta =
    "grid h-9 w-9 place-items-center rounded-lg text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-900";
  return (
    <div className={`flex items-center justify-between gap-2 rounded-xl border border-slate-200/70 bg-white p-1.5 ${sombra}`}>
      <Link href={`${caminho}?mes=${somarMeses(mes, -1)}`} className={seta} aria-label="Mês anterior">
        <ChevronLeft className="h-5 w-5" aria-hidden />
      </Link>
      <span className="inline-block min-w-40 text-center text-base font-semibold text-slate-900 first-letter:uppercase">
        {nomeDoMes(mes)}
      </span>
      <Link href={`${caminho}?mes=${somarMeses(mes, 1)}`} className={seta} aria-label="Próximo mês">
        <ChevronRight className="h-5 w-5" aria-hidden />
      </Link>
    </div>
  );
}

const TONS = {
  azul: { caixa: "bg-white", icone: "bg-blue-50 text-blue-600", valor: "text-slate-900" },
  verde: { caixa: "bg-white", icone: "bg-emerald-50 text-emerald-600", valor: "text-slate-900" },
  vermelho: { caixa: "bg-white", icone: "bg-red-50 text-red-500", valor: "text-slate-900" },
  positivo: { caixa: "bg-emerald-50/70 border-emerald-100", icone: "bg-emerald-100 text-emerald-700", valor: "text-emerald-700" },
  negativo: { caixa: "bg-red-50/70 border-red-100", icone: "bg-red-100 text-red-600", valor: "text-red-700" },
};

export function Cartao({
  titulo,
  valor,
  detalhe,
  icone: Icone,
  tom,
}: {
  titulo: string;
  valor: string;
  detalhe?: string;
  icone: LucideIcon;
  tom: keyof typeof TONS;
}) {
  const t = TONS[tom];
  return (
    <div className={`flex items-start gap-4 rounded-2xl border border-slate-200/70 p-5 ${t.caixa} ${sombra}`}>
      <span className={`grid h-12 w-12 shrink-0 place-items-center rounded-xl ${t.icone}`}>
        <Icone className="h-6 w-6" aria-hidden />
      </span>
      <div className="min-w-0">
        <p className="text-sm font-semibold text-slate-700">{titulo}</p>
        <p className={`mt-1 text-2xl font-extrabold tracking-tight tabular-nums ${t.valor}`}>{valor}</p>
        {detalhe && <p className="mt-0.5 text-sm text-slate-500">{detalhe}</p>}
      </div>
    </div>
  );
}

export function Painel({
  titulo,
  subtitulo,
  acao,
  id,
  className,
  children,
}: {
  titulo: string;
  subtitulo?: string;
  acao?: React.ReactNode;
  id?: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <section
      id={id}
      className={`flex min-w-0 scroll-mt-24 flex-col gap-4 rounded-2xl border border-slate-200/70 bg-white p-5 sm:p-6 ${sombra} ${className ?? ""}`}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-slate-900">{titulo}</h2>
          {subtitulo && <p className="text-sm text-slate-500">{subtitulo}</p>}
        </div>
        {acao}
      </div>
      {children}
    </section>
  );
}

export function Vazio({
  titulo,
  children,
  ilustracao,
  acao,
}: {
  titulo?: string;
  children?: React.ReactNode;
  ilustracao?: React.ReactNode;
  acao?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center gap-2 px-4 py-10 text-center">
      {ilustracao}
      {titulo && <p className="mt-2 text-lg font-bold text-slate-900">{titulo}</p>}
      {children && <div className="max-w-md text-sm text-slate-500">{children}</div>}
      {acao && <div className="mt-3">{acao}</div>}
    </div>
  );
}

// Casinha da tela vazia, desenhada com as cores do sistema.
export function IlustracaoCasa() {
  return (
    <svg viewBox="0 0 200 120" className="h-28 w-48" aria-hidden>
      <ellipse cx="100" cy="112" rx="88" ry="6" fill="#e2e8f0" />
      <circle cx="62" cy="58" r="30" fill="#e0ecff" />
      <circle cx="138" cy="62" r="26" fill="#e0ecff" />
      <circle cx="100" cy="48" r="34" fill="#eaf2ff" />
      <path d="M58 112V88a10 10 0 0 1 20 0v24" fill="#c7d8f5" />
      <rect x="66" y="96" width="2" height="16" fill="#94a3b8" />
      <path d="M126 112V90a9 9 0 0 1 18 0v22" fill="#c7d8f5" />
      <rect x="134" y="98" width="2" height="14" fill="#94a3b8" />
      <path d="M72 70 100 46l28 24v42H72Z" fill="#ffffff" />
      <path d="M66 74 100 44l34 30" fill="none" stroke="#2563eb" strokeWidth="7" strokeLinecap="round" strokeLinejoin="round" />
      <rect x="93" y="82" width="14" height="30" rx="3" fill="#2563eb" />
      <rect x="116" y="38" width="7" height="16" rx="1.5" fill="#cbd5e1" />
      <circle cx="80" cy="106" r="9" fill="#2563eb" />
      <circle cx="121" cy="106" r="9" fill="#1e3a8a" />
    </svg>
  );
}
