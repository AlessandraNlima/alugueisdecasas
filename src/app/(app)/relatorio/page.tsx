import Link from "next/link";
import { ChevronLeft, ChevronRight, FileSpreadsheet, Wallet, Download, FileText, CalendarDays } from "lucide-react";
import {
  CabecalhoPagina,
  Cartao,
  Painel,
  Vazio,
  botaoSecundario,
  sombra,
  tabelaCaixa,
  td,
  tdValor,
  th,
  thead,
} from "@/components/ui";
import { brl, hojeISO, indexarPagamentos, nomeCurtoDoMes, resumoDoMes } from "@/lib/alugueis";
import { buscarDespesas, buscarImoveis, buscarPagamentos, exigirUsuario } from "@/lib/dados";

function param(v: string | string[] | undefined) {
  return typeof v === "string" ? v : undefined;
}

export default async function RelatorioPage({ searchParams }: PageProps<"/relatorio">) {
  const sp = await searchParams;
  const hoje = hojeISO();
  const anoParam = Number(param(sp.ano));
  const ano = Number.isInteger(anoParam) && anoParam >= 2000 && anoParam <= 2100 ? anoParam : Number(hoje.slice(0, 4));
  const periodo = { de: `${ano}-01-01`, ate: `${ano}-12-31` };

  const { supabase } = await exigirUsuario();
  const [imoveis, pagamentosAno, despesasAno] = await Promise.all([
    buscarImoveis(supabase),
    buscarPagamentos(supabase, periodo),
    buscarDespesas(supabase, periodo),
  ]);
  const pagamentos = indexarPagamentos(pagamentosAno);

  const meses = Array.from({ length: 12 }, (_, i) => `${ano}-${String(i + 1).padStart(2, "0")}`);
  const linhas = meses.map((ym) => ({ ym, ...resumoDoMes(ym, imoveis, pagamentos, despesasAno, hoje) }));
  const soma = (k: "previsto" | "recebido" | "despesas" | "liquido") => linhas.reduce((s, l) => s + l[k], 0);
  const maior = Math.max(1, ...linhas.map((l) => l.previsto));

  const porImovel = imoveis.map((imovel) => {
    const recebido = pagamentosAno.filter((p) => p.imovel_id === imovel.id).reduce((s, p) => s + Number(p.valor), 0);
    const despesas = despesasAno.filter((d) => d.imovel_id === imovel.id).reduce((s, d) => s + Number(d.valor), 0);
    return { imovel, recebido, despesas, liquido: recebido - despesas };
  });
  const semMovimento = soma("previsto") === 0 && soma("recebido") === 0 && soma("despesas") === 0;

  const seta = "grid h-9 w-9 place-items-center rounded-lg text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-900";

  return (
    <>
      <CabecalhoPagina
        secao="Relatórios"
        titulo={`Relatório de ${ano}`}
        subtitulo="O ano mês a mês e o resultado de cada imóvel."
        acoes={
          <>
            {/* Link comum (não <Link>): é um download, não uma página. */}
            <a href={`/relatorio/csv?ano=${ano}`} className={botaoSecundario}>
              <FileSpreadsheet className="h-4 w-4 text-emerald-600" aria-hidden />
              Baixar planilha (CSV)
            </a>
            <div className={`flex items-center justify-between gap-2 rounded-xl border border-slate-200/70 bg-white p-1.5 ${sombra}`}>
              <Link href={`/relatorio?ano=${ano - 1}`} className={seta} aria-label="Ano anterior">
                <ChevronLeft className="h-5 w-5" aria-hidden />
              </Link>
              <span className="min-w-24 text-center text-base font-semibold tabular-nums">{ano}</span>
              <Link href={`/relatorio?ano=${ano + 1}`} className={seta} aria-label="Próximo ano">
                <ChevronRight className="h-5 w-5" aria-hidden />
              </Link>
            </div>
          </>
        }
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Cartao titulo="Previsto no ano" valor={brl(soma("previsto"))} icone={CalendarDays} tom="azul" />
        <Cartao titulo="Recebido no ano" valor={brl(soma("recebido"))} icone={Download} tom="verde" />
        <Cartao titulo="Despesas no ano" valor={brl(soma("despesas"))} icone={FileText} tom="vermelho" />
        <Cartao
          titulo="Saldo líquido"
          valor={brl(soma("liquido"))}
          detalhe="Recebido − despesas"
          icone={Wallet}
          tom={soma("liquido") < 0 ? "negativo" : "positivo"}
        />
      </div>

      <Painel titulo="Mês a mês" subtitulo="Clique no mês para abrir os aluguéis dele.">
        {semMovimento && (
          <p className="rounded-xl bg-slate-50 px-4 py-3 text-sm text-slate-600">
            Ainda não há aluguéis nem despesas em {ano}.
          </p>
        )}
        <div className={tabelaCaixa}>
          <table className="w-full text-sm">
            <thead className={thead}>
              <tr>
                <th className={th}>Mês</th>
                <th className={`${th} text-right`}>Previsto</th>
                <th className={`${th} text-right`}>Recebido</th>
                <th className={`${th} w-1/6`}>Recebido / previsto</th>
                <th className={`${th} text-right`}>Despesas</th>
                <th className={`${th} text-right`}>Líquido</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {linhas.map((l) => (
                <tr key={l.ym} className={l.ym === hoje.slice(0, 7) ? "bg-blue-50/60" : undefined}>
                  <td className={`${td} font-medium first-letter:uppercase`}>
                    <Link href={`/?mes=${l.ym}`} className="hover:text-blue-700 hover:underline">
                      {nomeCurtoDoMes(l.ym)}
                    </Link>
                  </td>
                  <td className={tdValor}>{brl(l.previsto)}</td>
                  <td className={`${tdValor} text-emerald-700`}>{brl(l.recebido)}</td>
                  <td className={td}>
                    <div
                      className="h-2 min-w-16 overflow-hidden rounded-full bg-slate-100"
                      title={l.previsto ? `${Math.round((l.recebido / l.previsto) * 100)}% recebido` : "Nada previsto"}
                    >
                      <div
                        className="h-full rounded-full bg-blue-600"
                        style={{ width: `${Math.min(100, (l.recebido / maior) * 100)}%` }}
                      />
                    </div>
                  </td>
                  <td className={`${tdValor} text-red-700`}>{brl(l.despesas)}</td>
                  <td className={`${tdValor} font-semibold ${l.liquido < 0 ? "text-red-700" : "text-emerald-700"}`}>
                    {brl(l.liquido)}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot className="border-t-2 border-slate-200 bg-slate-50/60 font-bold">
              <tr>
                <td className={td}>Total</td>
                <td className={tdValor}>{brl(soma("previsto"))}</td>
                <td className={`${tdValor} text-emerald-700`}>{brl(soma("recebido"))}</td>
                <td className={td} />
                <td className={`${tdValor} text-red-700`}>{brl(soma("despesas"))}</td>
                <td className={`${tdValor} ${soma("liquido") < 0 ? "text-red-700" : "text-emerald-700"}`}>
                  {brl(soma("liquido"))}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </Painel>

      <Painel titulo={`Por imóvel em ${ano}`}>
        {porImovel.length === 0 ? (
          <Vazio titulo="Nenhum imóvel cadastrado">
            <Link href="/imoveis#novo" className="font-semibold text-blue-700 hover:underline">
              Cadastre um imóvel
            </Link>{" "}
            para ver o resultado de cada um.
          </Vazio>
        ) : (
          <div className={tabelaCaixa}>
            <table className="w-full text-sm">
              <thead className={thead}>
                <tr>
                  <th className={th}>Imóvel</th>
                  <th className={`${th} text-right`}>Recebido</th>
                  <th className={`${th} text-right`}>Despesas</th>
                  <th className={`${th} text-right`}>Líquido</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {porImovel.map((r) => (
                  <tr key={r.imovel.id}>
                    <td className={`${td} font-medium text-slate-900`}>{r.imovel.apelido}</td>
                    <td className={`${tdValor} text-emerald-700`}>{brl(r.recebido)}</td>
                    <td className={`${tdValor} text-red-700`}>{brl(r.despesas)}</td>
                    <td className={`${tdValor} font-semibold ${r.liquido < 0 ? "text-red-700" : "text-emerald-700"}`}>
                      {brl(r.liquido)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Painel>
    </>
  );
}
