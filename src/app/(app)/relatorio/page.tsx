import Link from "next/link";
import { Painel, Vazio, botaoSecundario, td, tdValor, th } from "@/components/ui";
import {
  brl,
  hojeISO,
  indexarPagamentos,
  nomeCurtoDoMes,
  resumoDoMes,
} from "@/lib/alugueis";
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
  const soma = (k: "previsto" | "recebido" | "despesas" | "liquido") =>
    linhas.reduce((s, l) => s + l[k], 0);
  const maior = Math.max(1, ...linhas.map((l) => l.previsto));

  const porImovel = imoveis.map((imovel) => {
    const recebido = pagamentosAno
      .filter((p) => p.imovel_id === imovel.id)
      .reduce((s, p) => s + Number(p.valor), 0);
    const despesas = despesasAno
      .filter((d) => d.imovel_id === imovel.id)
      .reduce((s, d) => s + Number(d.valor), 0);
    return { imovel, recebido, despesas, liquido: recebido - despesas };
  });

  const seta = "rounded-md px-2.5 py-1 text-slate-500 hover:bg-slate-200 hover:text-slate-900";

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold text-slate-900">Relatório</h1>
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1">
            <Link href={`/relatorio?ano=${ano - 1}`} className={seta} aria-label="Ano anterior">
              ◀
            </Link>
            <span className="font-mono text-lg font-semibold">{ano}</span>
            <Link href={`/relatorio?ano=${ano + 1}`} className={seta} aria-label="Próximo ano">
              ▶
            </Link>
          </div>
          {/* Link comum (não <Link>): é um download, não uma página. */}
          <a href={`/relatorio/csv?ano=${ano}`} className={botaoSecundario}>
            Baixar planilha (CSV)
          </a>
        </div>
      </div>

      <Painel titulo={`Mês a mês em ${ano}`}>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b border-slate-200">
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
                <tr key={l.ym} className={l.ym === hoje.slice(0, 7) ? "bg-emerald-50" : undefined}>
                  <td className={`${td} capitalize`}>
                    <Link href={`/?mes=${l.ym}`} className="hover:text-emerald-700 hover:underline">
                      {nomeCurtoDoMes(l.ym)}
                    </Link>
                  </td>
                  <td className={tdValor}>{brl(l.previsto)}</td>
                  <td className={tdValor}>{brl(l.recebido)}</td>
                  <td className={td}>
                    <div
                      className="h-1.5 min-w-16 overflow-hidden rounded bg-slate-200"
                      title={l.previsto ? `${Math.round((l.recebido / l.previsto) * 100)}% recebido` : "Nada previsto"}
                    >
                      <div
                        className="h-full bg-emerald-600"
                        style={{ width: `${Math.min(100, (l.recebido / maior) * 100)}%` }}
                      />
                    </div>
                  </td>
                  <td className={tdValor}>{brl(l.despesas)}</td>
                  <td className={`${tdValor} ${l.liquido < 0 ? "text-red-700" : ""}`}>{brl(l.liquido)}</td>
                </tr>
              ))}
            </tbody>
            <tfoot className="border-t-2 border-slate-200 font-semibold">
              <tr>
                <td className={td}>Total</td>
                <td className={tdValor}>{brl(soma("previsto"))}</td>
                <td className={tdValor}>{brl(soma("recebido"))}</td>
                <td className={td} />
                <td className={tdValor}>{brl(soma("despesas"))}</td>
                <td className={tdValor}>{brl(soma("liquido"))}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      </Painel>

      <Painel titulo={`Por imóvel em ${ano}`}>
        {porImovel.length === 0 ? (
          <Vazio>Nenhum imóvel cadastrado.</Vazio>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-slate-200">
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
                    <td className={td}>{r.imovel.apelido}</td>
                    <td className={tdValor}>{brl(r.recebido)}</td>
                    <td className={tdValor}>{brl(r.despesas)}</td>
                    <td className={`${tdValor} ${r.liquido < 0 ? "text-red-700" : ""}`}>{brl(r.liquido)}</td>
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
