"use client";

import { useMemo, useState } from "react";
import { ArrowDown, ArrowUp, ChevronsUpDown, Search, Undo2 } from "lucide-react";
import { BotaoConfirmar } from "@/components/botao-confirmar";
import { SubmitButton } from "@/components/submit-button";
import { Etiqueta, botaoDiscreto, botaoPerigo, botaoPrincipal, campo } from "@/components/ui";

export type LinhaAluguel = {
  id: string;
  apelido: string;
  endereco: string | null;
  inquilino: string | null;
  vencimento: string; // AAAA-MM-DD
  valor: number;
  situacao: "pago" | "aberto" | "atrasado";
  pagamento: { id: string; valor: number; data: string; observacao: string | null; registradoPor: string | null } | null;
  dataSugerida: string;
};

type Campo = "apelido" | "vencimento" | "valor" | "situacao";

const ORDEM_SITUACAO = { atrasado: 0, aberto: 1, pago: 2 };
const ROTULO_SITUACAO = { pago: "Pago", aberto: "Em aberto", atrasado: "Atrasado" };

const brl = (n: number) => n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
const dataBR = (iso: string) => iso.split("-").reverse().join("/");
const semAcento = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
const paraCampo = (n: number) => n.toFixed(2).replace(".", ",");

export function TabelaAlugueis({
  linhas,
  mes,
  voltar,
  registrarPagamento,
  desfazerPagamento,
}: {
  linhas: LinhaAluguel[];
  mes: string;
  voltar: string;
  registrarPagamento: (formData: FormData) => Promise<void>;
  desfazerPagamento: (formData: FormData) => Promise<void>;
}) {
  const [busca, setBusca] = useState("");
  const [ordem, setOrdem] = useState<{ campo: Campo; dir: 1 | -1 }>({ campo: "situacao", dir: 1 });
  const [aberto, setAberto] = useState<string | null>(null);

  const visiveis = useMemo(() => {
    const termo = semAcento(busca.trim());
    const filtradas = termo
      ? linhas.filter((l) => semAcento(`${l.apelido} ${l.inquilino ?? ""} ${l.endereco ?? ""}`).includes(termo))
      : linhas;
    const valorDe = (l: LinhaAluguel): string | number => {
      switch (ordem.campo) {
        case "apelido":
          return semAcento(l.apelido);
        case "vencimento":
          return l.vencimento;
        case "valor":
          return l.valor;
        case "situacao":
          return ORDEM_SITUACAO[l.situacao];
      }
    };
    return [...filtradas].sort((a, b) => {
      const va = valorDe(a);
      const vb = valorDe(b);
      const c = va < vb ? -1 : va > vb ? 1 : a.vencimento.localeCompare(b.vencimento);
      return c * ordem.dir;
    });
  }, [linhas, busca, ordem]);

  // Função de render (não componente) para não recriar um tipo de componente a cada render.
  function cabecalho(c: Campo, children: string) {
    const atual = ordem.campo === c;
    const Icone = !atual ? ChevronsUpDown : ordem.dir === 1 ? ArrowUp : ArrowDown;
    return (
      <button
        type="button"
        onClick={() => setOrdem(atual ? { campo: c, dir: ordem.dir === 1 ? -1 : 1 } : { campo: c, dir: 1 })}
        aria-label={`Ordenar por ${children.toLowerCase()}`}
        className={`inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider hover:text-slate-900 ${
          atual ? "text-slate-900" : "text-slate-500"
        }`}
      >
        {children}
        <Icone className="h-3.5 w-3.5" aria-hidden />
      </button>
    );
  }

  // Vira tabela quando a própria lista tem espaço (container query), não pela
  // largura da tela: ao lado do painel de pendências ela é mais estreita.
  const grade = "@[40rem]:grid @[40rem]:grid-cols-[minmax(8rem,1fr)_5.75rem_6.75rem_6.75rem_9.5rem] @[40rem]:items-center @[40rem]:gap-3";

  return (
    <div className="@container flex flex-col gap-4">
      <label className="relative block sm:max-w-sm sm:self-end">
        <span className="sr-only">Buscar imóvel ou inquilino</span>
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" aria-hidden />
        <input
          type="search"
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          placeholder="Buscar imóvel ou inquilino..."
          className={`${campo} pl-9`}
        />
      </label>

      <div className="overflow-hidden rounded-xl border border-slate-100">
        <div className={`hidden bg-slate-50/80 px-4 py-3 ${grade}`}>
          {cabecalho("apelido", "Imóvel")}
          {cabecalho("vencimento", "Vencimento")}
          {cabecalho("valor", "Valor")}
          {cabecalho("situacao", "Status")}
          <span className="text-right text-xs font-semibold uppercase tracking-wider text-slate-500">Pagamento</span>
        </div>

        {visiveis.length === 0 ? (
          <p className="px-4 py-10 text-center text-sm text-slate-500">
            Nenhum aluguel encontrado para “{busca}”.
          </p>
        ) : (
          <ul className="divide-y divide-slate-100">
            {visiveis.map((l) => (
              <li key={l.id} className="px-4 py-4">
                <div className={`flex flex-col gap-3 ${grade}`}>
                  <div className="min-w-0">
                    <p className="truncate font-semibold text-slate-900">{l.apelido}</p>
                    <p className="truncate text-sm text-slate-500">{l.inquilino ?? "Sem inquilino"}</p>
                  </div>
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-2 @[40rem]:contents">
                    <p className="whitespace-nowrap text-sm text-slate-700 tabular-nums">
                      <span className="mr-1 text-slate-400 @[40rem]:hidden">Vence</span>
                      {dataBR(l.vencimento)}
                    </p>
                    <p className="whitespace-nowrap font-semibold text-slate-900 tabular-nums">{brl(l.valor)}</p>
                    <div>
                      <Etiqueta tipo={l.situacao}>{ROTULO_SITUACAO[l.situacao]}</Etiqueta>
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-x-2 gap-y-1 @[40rem]:flex-col @[40rem]:items-end">
                    {l.pagamento ? (
                      <>
                        <span className="text-sm text-slate-600 @[40rem]:text-right">
                          <span className="font-semibold text-emerald-700 tabular-nums">{brl(l.pagamento.valor)}</span>{" "}
                          <span className="whitespace-nowrap @[40rem]:block @[40rem]:text-xs">
                            em {dataBR(l.pagamento.data)}
                          </span>
                          {l.pagamento.registradoPor && (
                            <span className="block text-xs text-slate-400">por {l.pagamento.registradoPor}</span>
                          )}
                        </span>
                        <span className="flex items-center gap-1">
                          <button type="button" onClick={() => setAberto(aberto === l.id ? null : l.id)} className={botaoDiscreto}>
                            Editar
                          </button>
                          <form action={desfazerPagamento}>
                            <input type="hidden" name="id" value={l.pagamento.id} />
                            <input type="hidden" name="voltar" value={voltar} />
                            <BotaoConfirmar confirmar="Confirmar?" className={botaoPerigo}>
                              <Undo2 className="h-3.5 w-3.5" aria-hidden />
                              Desfazer
                            </BotaoConfirmar>
                          </form>
                        </span>
                      </>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setAberto(aberto === l.id ? null : l.id)}
                        aria-expanded={aberto === l.id}
                        className={
                          aberto === l.id
                            ? "rounded-lg bg-slate-100 px-3 py-2 text-sm font-semibold text-slate-700"
                            : `${botaoPrincipal} whitespace-nowrap px-3 py-2`
                        }
                      >
                        {aberto === l.id ? (
                          "Cancelar"
                        ) : (
                          <>
                            <span className="@[40rem]:hidden">Registrar pagamento</span>
                            <span className="hidden @[40rem]:inline" title="Registrar pagamento">
                              Registrar
                            </span>
                          </>
                        )}
                      </button>
                    )}
                  </div>
                </div>

                {aberto === l.id && (
                  <form
                    action={registrarPagamento}
                    className="mt-4 grid grid-cols-1 gap-3 rounded-xl bg-slate-50 p-4 sm:grid-cols-[repeat(3,minmax(0,1fr))_auto] sm:items-end"
                  >
                    <input type="hidden" name="imovel_id" value={l.id} />
                    <input type="hidden" name="mes" value={mes} />
                    <input type="hidden" name="voltar" value={voltar} />
                    <label className="flex flex-col gap-1 text-xs font-medium text-slate-600">
                      Valor recebido (R$)
                      <input
                        name="valor"
                        inputMode="decimal"
                        required
                        defaultValue={paraCampo(l.pagamento?.valor ?? l.valor)}
                        className={campo}
                      />
                    </label>
                    <label className="flex flex-col gap-1 text-xs font-medium text-slate-600">
                      Pago em
                      <input
                        name="data_pagamento"
                        type="date"
                        required
                        defaultValue={l.pagamento?.data ?? l.dataSugerida}
                        className={campo}
                      />
                    </label>
                    <label className="flex flex-col gap-1 text-xs font-medium text-slate-600">
                      Observação
                      <input
                        name="observacao"
                        placeholder="Ex.: Pix"
                        defaultValue={l.pagamento?.observacao ?? ""}
                        className={campo}
                      />
                    </label>
                    <SubmitButton className={botaoPrincipal}>Salvar</SubmitButton>
                  </form>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
