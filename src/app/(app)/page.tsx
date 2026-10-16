import Link from "next/link";
import { ChartColumn, ChartNoAxesColumn, Check, CalendarDays, Download, FileText, Plus } from "lucide-react";
import {
  CabecalhoPagina,
  Cartao,
  IlustracaoCasa,
  Mensagem,
  NavegarMes,
  Painel,
  Vazio,
  botaoPrincipal,
  sombra,
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
  vencimento,
} from "@/lib/alugueis";
import { buscarDespesas, buscarImoveis, buscarNomesUsuarios, buscarPagamentos, exigirUsuario } from "@/lib/dados";
import { desfazerPagamento, registrarPagamento } from "./actions";
import { TabelaAlugueis, type LinhaAluguel } from "./tabela-alugueis";

function param(v: string | string[] | undefined) {
  return typeof v === "string" ? v : undefined;
}

function plural(n: number, um: string, varios: string) {
  return `${n} ${n === 1 ? um : varios}`;
}

export default async function VisaoGeralPage({ searchParams }: PageProps<"/">) {
  const sp = await searchParams;
  const mes = mesValido(param(sp.mes)) ?? mesAtual();
  const hoje = hojeISO();
  const voltar = `/?mes=${mes}`;

  const { supabase } = await exigirUsuario();
  const [imoveis, todosPagamentos, despesas, nomes] = await Promise.all([
    buscarImoveis(supabase),
    // Todos os pagamentos: as pendências olham todos os meses desde o
    // início de cada contrato, não só o mês aberto na tela.
    buscarPagamentos(supabase),
    buscarDespesas(supabase, { de: `${mes}-01`, ate: vencimento(mes, 31) }),
    buscarNomesUsuarios(),
  ]);
  const pagamentos = indexarPagamentos(todosPagamentos);
  const resumo = resumoDoMes(mes, imoveis, pagamentos, despesas, hoje);
  const atrasos = listarAtrasos(imoveis, pagamentos, hoje);
  const totalAtrasado = atrasos.reduce((s, a) => s + Number(a.imovel.valor_aluguel), 0);

  const linhas: LinhaAluguel[] = [];
  for (const imovel of imoveis) {
    const s = situacaoNoMes(imovel, mes, pagamentos.get(chavePagamento(imovel.id, mes)), hoje);
    if (s.tipo === "fora") continue;
    const vence = vencimento(mes, imovel.dia_vencimento);
    linhas.push({
      id: imovel.id,
      apelido: imovel.apelido,
      endereco: imovel.endereco,
      inquilino: imovel.inquilino_nome,
      vencimento: vence,
      valor: Number(imovel.valor_aluguel),
      situacao: s.tipo,
      pagamento:
        s.tipo === "pago"
          ? {
              id: s.pagamento.id,
              valor: Number(s.pagamento.valor),
              data: s.pagamento.data_pagamento,
              observacao: s.pagamento.observacao,
              registradoPor: s.pagamento.owner_id ? (nomes[s.pagamento.owner_id] ?? null) : null,
            }
          : null,
      dataSugerida: mes === hoje.slice(0, 7) ? hoje : vence,
    });
  }
  const pagos = linhas.filter((l) => l.situacao === "pago").length;
  const qtdDespesas = despesas.filter((d) => d.data.startsWith(mes)).length;

  const botaoCadastrar = (
    <Link href="/imoveis#novo" className={`${botaoPrincipal} px-5 py-3 text-base`}>
      <Plus className="h-5 w-5" aria-hidden />
      Cadastrar imóvel
    </Link>
  );

  return (
    <>
      <CabecalhoPagina
        secao="Visão geral"
        titulo="Seus aluguéis, em um só lugar."
        subtitulo="Acompanhe os recebimentos e mantenha tudo em dia."
        acoes={
          <>
            {botaoCadastrar}
            <NavegarMes caminho="/" mes={mes} />
          </>
        }
      />

      <Mensagem ok={param(sp.ok)} erro={param(sp.erro)} />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Cartao
          titulo="Previsto"
          valor={brl(resumo.previsto)}
          detalhe={`${plural(linhas.length, "imóvel", "imóveis")} no mês`}
          icone={CalendarDays}
          tom="azul"
        />
        <Cartao
          titulo="Recebido"
          valor={brl(resumo.recebido)}
          detalhe={
            pagos === 0 ? "Nenhum recebimento" : resumo.falta > 0 ? `Falta ${brl(resumo.falta)}` : "Tudo recebido"
          }
          icone={Download}
          tom="verde"
        />
        <Cartao
          titulo="Despesas"
          valor={brl(resumo.despesas)}
          detalhe={qtdDespesas === 0 ? "Nenhuma despesa" : `${plural(qtdDespesas, "lançamento", "lançamentos")} no mês`}
          icone={FileText}
          tom="vermelho"
        />
        <Cartao
          titulo="Saldo líquido"
          valor={brl(resumo.liquido)}
          detalhe="Recebido − despesas"
          icone={ChartNoAxesColumn}
          tom={resumo.liquido < 0 ? "negativo" : "positivo"}
        />
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_21rem]">
        <Painel
          titulo="Aluguéis do mês"
          subtitulo={`${plural(linhas.length, "registro", "registros")} · ${nomeDoMes(mes)}`}
        >
          {linhas.length > 0 ? (
            <TabelaAlugueis
              linhas={linhas}
              mes={mes}
              voltar={voltar}
              registrarPagamento={registrarPagamento}
              desfazerPagamento={desfazerPagamento}
            />
          ) : imoveis.length === 0 ? (
            <Vazio ilustracao={<IlustracaoCasa />} titulo="Tudo pronto para começar" acao={botaoCadastrar}>
              Cadastre seu primeiro imóvel para acompanhar os aluguéis.
            </Vazio>
          ) : (
            <Vazio ilustracao={<IlustracaoCasa />} titulo="Nenhum aluguel neste mês">
              Os imóveis cadastrados começam depois deste mês ou estão desocupados. Use as setas do seletor de mês
              para ver outro período.
            </Vazio>
          )}
        </Painel>

        <Painel
          titulo="Pendências"
          subtitulo="Aluguéis vencidos sem pagamento"
          acao={
            <span
              className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${
                atrasos.length ? "bg-red-50 text-red-700" : "bg-emerald-50 text-emerald-700"
              }`}
            >
              <span className="h-1.5 w-1.5 rounded-full bg-current" aria-hidden />
              {atrasos.length ? plural(atrasos.length, "atrasado", "atrasados") : "Tudo em dia"}
            </span>
          }
        >
          {atrasos.length === 0 ? (
            <Vazio
              ilustracao={
                <span className="grid h-20 w-20 place-items-center rounded-full bg-emerald-50">
                  <Check className="h-10 w-10 text-emerald-600" strokeWidth={2.5} aria-hidden />
                </span>
              }
              titulo="Nenhum aluguel atrasado"
            >
              Seus pagamentos pendentes aparecerão aqui.
            </Vazio>
          ) : (
            <>
              <ul className="flex flex-col gap-2">
                {atrasos.map((a) => (
                  <li key={`${a.imovel.id}-${a.ym}`}>
                    <Link
                      href={`/?mes=${a.ym}`}
                      className="flex items-start justify-between gap-3 rounded-xl border border-red-100 bg-red-50/40 p-3 transition-colors hover:bg-red-50"
                    >
                      <span className="min-w-0">
                        <span className="block truncate font-semibold text-slate-900">{a.imovel.apelido}</span>
                        <span className="block truncate text-sm text-slate-600">
                          {[a.imovel.inquilino_nome, a.imovel.inquilino_telefone].filter(Boolean).join(" · ") ||
                            "Sem inquilino"}
                        </span>
                        <span className="mt-1 block text-xs text-red-700">
                          <span className="first-letter:uppercase">{nomeDoMes(a.ym)}</span> · venceu em{" "}
                          {dataBR(a.vence)} · {plural(a.dias, "dia", "dias")}
                        </span>
                      </span>
                      <span className="shrink-0 font-semibold text-red-700 tabular-nums">
                        {brl(a.imovel.valor_aluguel)}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
              <div className="flex items-center justify-between border-t border-slate-100 pt-3 text-sm">
                <span className="font-medium text-slate-600">Total em atraso</span>
                <span className="font-bold text-red-700 tabular-nums">{brl(totalAtrasado)}</span>
              </div>
            </>
          )}
        </Painel>
      </div>

      <Link
        href="/relatorio"
        className={`group flex items-center gap-4 overflow-hidden rounded-2xl border border-blue-100 bg-gradient-to-r from-blue-50 to-white p-5 ${sombra}`}
      >
        <span className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-white text-blue-600 shadow-sm">
          <ChartColumn className="h-6 w-6" aria-hidden />
        </span>
        <span className="min-w-0">
          <span className="block font-bold text-slate-900">Mais organização para cuidar do que é seu.</span>
          <span className="block text-sm text-slate-500">
            Veja o relatório do ano, mês a mês, e baixe a planilha para o Excel.
          </span>
        </span>
        <span className="ml-auto hidden text-sm font-semibold text-blue-700 group-hover:underline sm:block">
          Abrir relatório →
        </span>
      </Link>
    </>
  );
}
