import Link from "next/link";
import { BotaoConfirmar } from "@/components/botao-confirmar";
import { SubmitButton } from "@/components/submit-button";
import {
  Cartao,
  Etiqueta,
  Mensagem,
  NavegarMes,
  Painel,
  Vazio,
  botaoPrincipal,
  campo,
  td,
  tdValor,
  th,
} from "@/components/ui";
import {
  brl,
  chavePagamento,
  dataBR,
  hojeISO,
  indexarPagamentos,
  listarAtrasos,
  mesAtual,
  mesValido,
  nomeDoMes,
  resumoDoMes,
  situacaoNoMes,
  valorParaCampo,
  vencimento,
} from "@/lib/alugueis";
import { buscarDespesas, buscarImoveis, buscarPagamentos, exigirUsuario } from "@/lib/dados";
import { desfazerPagamento, registrarPagamento } from "./actions";

function param(v: string | string[] | undefined) {
  return typeof v === "string" ? v : undefined;
}

export default async function MesPage({ searchParams }: PageProps<"/">) {
  const sp = await searchParams;
  const mes = mesValido(param(sp.mes)) ?? mesAtual();
  const hoje = hojeISO();
  const voltar = `/?mes=${mes}`;

  const { supabase } = await exigirUsuario();
  const [imoveis, todosPagamentos, despesas] = await Promise.all([
    buscarImoveis(supabase),
    // Todos os pagamentos: a lista de atrasados olha todos os meses desde o
    // início de cada contrato, não só o mês aberto na tela.
    buscarPagamentos(supabase),
    buscarDespesas(supabase, { de: `${mes}-01`, ate: vencimento(mes, 31) }),
  ]);
  const pagamentos = indexarPagamentos(todosPagamentos);
  const resumo = resumoDoMes(mes, imoveis, pagamentos, despesas, hoje);
  const atrasos = listarAtrasos(imoveis, pagamentos, hoje);

  const linhas = imoveis
    .map((imovel) => ({
      imovel,
      situacao: situacaoNoMes(imovel, mes, pagamentos.get(chavePagamento(imovel.id, mes)), hoje),
    }))
    .filter((l) => l.situacao.tipo !== "fora");

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold text-slate-900">Aluguéis do mês</h1>
        <NavegarMes caminho="/" mes={mes} />
      </div>

      <Mensagem ok={param(sp.ok)} erro={param(sp.erro)} />

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Cartao
          titulo="Previsto"
          valor={brl(resumo.previsto)}
          detalhe={`${linhas.length} ${linhas.length === 1 ? "imóvel" : "imóveis"} no mês`}
        />
        <Cartao titulo="Recebido" valor={brl(resumo.recebido)} detalhe={`Falta ${brl(resumo.falta)}`} />
        <Cartao titulo="Despesas" valor={brl(resumo.despesas)} detalhe="lançadas no mês" />
        <Cartao titulo="Líquido" valor={brl(resumo.liquido)} detalhe="recebido − despesas" destaque />
      </div>

      <Painel titulo={`Aluguéis de ${nomeDoMes(mes)}`}>
        {linhas.length === 0 ? (
          <Vazio>
            Nenhum imóvel com aluguel neste mês.{" "}
            <Link href="/imoveis" className="font-medium text-emerald-700 underline">
              Cadastre um imóvel
            </Link>{" "}
            para começar.
          </Vazio>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-slate-200">
                <tr>
                  <th className={th}>Imóvel / inquilino</th>
                  <th className={th}>Vence</th>
                  <th className={`${th} text-right`}>Aluguel</th>
                  <th className={th}>Situação</th>
                  <th className={th}>Pagamento</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {linhas.map(({ imovel, situacao }) => (
                  <tr key={imovel.id}>
                    <td className={td}>
                      <p className="font-medium text-slate-900">{imovel.apelido}</p>
                      <p className="text-xs text-slate-500">{imovel.inquilino_nome ?? "Sem inquilino"}</p>
                    </td>
                    <td className={`${td} font-mono tabular-nums`}>
                      {dataBR(vencimento(mes, imovel.dia_vencimento)).slice(0, 5)}
                    </td>
                    <td className={tdValor}>{brl(imovel.valor_aluguel)}</td>
                    <td className={td}>
                      <Etiqueta tipo={situacao.tipo}>
                        {situacao.tipo === "pago" ? "Pago" : situacao.tipo === "atrasado" ? "Atrasado" : "Em aberto"}
                      </Etiqueta>
                    </td>
                    <td className={td}>
                      {situacao.tipo === "pago" ? (
                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                          <span className="font-mono tabular-nums">{brl(situacao.pagamento.valor)}</span>
                          <span className="text-xs text-slate-500">
                            em {dataBR(situacao.pagamento.data_pagamento)}
                            {situacao.pagamento.observacao ? ` · ${situacao.pagamento.observacao}` : ""}
                          </span>
                          <form action={desfazerPagamento}>
                            <input type="hidden" name="id" value={situacao.pagamento.id} />
                            <input type="hidden" name="voltar" value={voltar} />
                            <BotaoConfirmar
                              confirmar="Confirmar?"
                              className="rounded px-2 py-0.5 text-xs text-slate-500 hover:bg-red-50 hover:text-red-700"
                            >
                              Desfazer
                            </BotaoConfirmar>
                          </form>
                        </div>
                      ) : (
                        <details className="group">
                          <summary className="inline-block cursor-pointer list-none rounded-md bg-emerald-700 px-3 py-1 text-xs font-medium text-white hover:bg-emerald-800 group-open:bg-slate-200 group-open:text-slate-700">
                            Registrar pagamento
                          </summary>
                          <form action={registrarPagamento} className="mt-2 flex flex-wrap items-end gap-2">
                            <input type="hidden" name="imovel_id" value={imovel.id} />
                            <input type="hidden" name="mes" value={mes} />
                            <input type="hidden" name="voltar" value={voltar} />
                            <label className="flex flex-col gap-0.5 text-xs text-slate-600">
                              Valor (R$)
                              <input
                                name="valor"
                                inputMode="decimal"
                                required
                                defaultValue={valorParaCampo(imovel.valor_aluguel)}
                                className={`${campo} w-28`}
                              />
                            </label>
                            <label className="flex flex-col gap-0.5 text-xs text-slate-600">
                              Pago em
                              <input
                                name="data_pagamento"
                                type="date"
                                required
                                defaultValue={mes === hoje.slice(0, 7) ? hoje : vencimento(mes, imovel.dia_vencimento)}
                                className={`${campo} w-40`}
                              />
                            </label>
                            <label className="flex flex-col gap-0.5 text-xs text-slate-600">
                              Observação
                              <input name="observacao" placeholder="Ex.: Pix" className={`${campo} w-36`} />
                            </label>
                            <SubmitButton className={`${botaoPrincipal} py-2`}>Salvar</SubmitButton>
                          </form>
                        </details>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Painel>

      <Painel
        titulo="Atrasados até hoje"
        acao={
          <Etiqueta tipo={atrasos.length ? "atrasado" : "pago"}>
            {atrasos.length ? `${atrasos.length} pendente${atrasos.length > 1 ? "s" : ""}` : "Tudo em dia"}
          </Etiqueta>
        }
      >
        {atrasos.length === 0 ? (
          <Vazio>Nenhum aluguel vencido sem pagamento.</Vazio>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-slate-200">
                <tr>
                  <th className={th}>Imóvel / inquilino</th>
                  <th className={th}>Mês</th>
                  <th className={th}>Venceu em</th>
                  <th className={`${th} text-right`}>Dias</th>
                  <th className={`${th} text-right`}>Valor</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {atrasos.map((a) => (
                  <tr key={`${a.imovel.id}-${a.ym}`}>
                    <td className={td}>
                      <p className="font-medium text-slate-900">{a.imovel.apelido}</p>
                      <p className="text-xs text-slate-500">
                        {[a.imovel.inquilino_nome, a.imovel.inquilino_telefone].filter(Boolean).join(" · ")}
                      </p>
                    </td>
                    <td className={td}>
                      <Link href={`/?mes=${a.ym}`} className="capitalize text-emerald-700 hover:underline">
                        {nomeDoMes(a.ym)}
                      </Link>
                    </td>
                    <td className={`${td} font-mono tabular-nums`}>{dataBR(a.vence)}</td>
                    <td className={tdValor}>{a.dias}</td>
                    <td className={tdValor}>{brl(a.imovel.valor_aluguel)}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="border-t-2 border-slate-200 font-semibold">
                <tr>
                  <td className={td} colSpan={4}>
                    Total em atraso
                  </td>
                  <td className={tdValor}>
                    {brl(atrasos.reduce((s, a) => s + Number(a.imovel.valor_aluguel), 0))}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </Painel>
    </>
  );
}
