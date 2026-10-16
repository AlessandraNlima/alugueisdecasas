import Link from "next/link";
import { nomeDoMes, somarMeses, type Situacao } from "@/lib/alugueis";

export function Mensagem({ ok, erro }: { ok?: string; erro?: string }) {
  if (erro) {
    return (
      <p role="alert" className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
        {erro}
      </p>
    );
  }
  if (ok) {
    return (
      <p role="status" className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
        {ok}
      </p>
    );
  }
  return null;
}

const ESTILO_SITUACAO: Record<Situacao["tipo"], string> = {
  pago: "bg-emerald-100 text-emerald-800",
  aberto: "bg-amber-100 text-amber-800",
  atrasado: "bg-red-100 text-red-800",
  fora: "bg-slate-100 text-slate-600",
};

export function Etiqueta({ tipo, children }: { tipo: Situacao["tipo"]; children: React.ReactNode }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-semibold ${ESTILO_SITUACAO[tipo]}`}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current" aria-hidden />
      {children}
    </span>
  );
}

export function NavegarMes({ caminho, mes }: { caminho: string; mes: string }) {
  const seta =
    "rounded-md px-2.5 py-1 text-slate-500 hover:bg-slate-200 hover:text-slate-900";
  return (
    <div className="flex items-center gap-1">
      <Link href={`${caminho}?mes=${somarMeses(mes, -1)}`} className={seta} aria-label="Mês anterior">
        ◀
      </Link>
      <span className="min-w-44 text-center text-lg inline-block font-semibold text-slate-900 first-letter:uppercase">
        {nomeDoMes(mes)}
      </span>
      <Link href={`${caminho}?mes=${somarMeses(mes, 1)}`} className={seta} aria-label="Próximo mês">
        ▶
      </Link>
    </div>
  );
}

export function Cartao({ titulo, valor, detalhe, destaque }: {
  titulo: string;
  valor: string;
  detalhe?: string;
  destaque?: boolean;
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white px-4 py-3">
      <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">{titulo}</p>
      <p className={`mt-1 font-mono text-xl tabular-nums ${destaque ? "text-emerald-700" : "text-slate-900"}`}>
        {valor}
      </p>
      {detalhe && <p className="text-xs text-slate-500">{detalhe}</p>}
    </div>
  );
}

export function Painel({ titulo, acao, children }: {
  titulo: string;
  acao?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="flex min-w-0 flex-col gap-3 rounded-xl border border-slate-200 bg-white p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-base font-semibold text-slate-900">{titulo}</h2>
        {acao}
      </div>
      {children}
    </section>
  );
}

export function Vazio({ children }: { children: React.ReactNode }) {
  return (
    <p className="rounded-lg border border-dashed border-slate-300 px-4 py-6 text-center text-sm text-slate-500">
      {children}
    </p>
  );
}

export const campo =
  "w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-emerald-600 focus:outline-none focus:ring-1 focus:ring-emerald-600";
export const rotulo = "flex flex-col gap-1 text-sm font-medium text-slate-700";
export const botaoPrincipal =
  "rounded-md bg-emerald-700 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-800";
export const botaoSecundario =
  "rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50";
export const th = "whitespace-nowrap px-3 py-2 text-left text-xs font-semibold uppercase tracking-wider text-slate-500";
export const td = "px-3 py-2.5 align-middle";
export const tdValor = "whitespace-nowrap px-3 py-2.5 text-right font-mono tabular-nums";
