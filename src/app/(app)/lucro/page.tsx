import Link from "next/link";
import { Download, FileText, HandCoins, Users } from "lucide-react";
import {
  CabecalhoPagina,
  Cartao,
  NavegarMes,
  Painel,
  Vazio,
  tabelaCaixa,
  td,
  tdValor,
  th,
  thead,
} from "@/components/ui";
import {
  brl,
  dividirIgual,
  hojeISO,
  indexarPagamentos,
  mesAtual,
  mesValido,
  nomeCurtoDoMes,
  nomeDoMes,
  resumoDoMes,
} from "@/lib/alugueis";
import { buscarDespesas, buscarImoveis, buscarPagamentos, buscarSocios, exigirUsuario } from "@/lib/dados";

function param(v: string | string[] | undefined) {
  return typeof v === "string" ? v : undefined;
}

// Zero fica em cinza para os meses sem movimento não poluírem a tabela.
const corValor = (n: number) => (n < 0 ? "text-red-700" : n > 0 ? "text-emerald-700" : "text-slate-400");
const corDespesa = (n: number) => (n > 0 ? "text-red-700" : "text-slate-400");

export default async function LucroPage({ searchParams }: PageProps<"/lucro">) {
  const sp = await searchParams;
  const mes = mesValido(param(sp.mes)) ?? mesAtual();
  const ano = mes.slice(0, 4);
  const hoje = hojeISO();
  const periodo = { de: `${ano}-01-01`, ate: `${ano}-12-31` };

  const { supabase, user } = await exigirUsuario();
  const [imoveis, pagamentosAno, despesasAno, socios] = await Promise.all([
    buscarImoveis(supabase),
    buscarPagamentos(supabase, periodo),
    buscarDespesas(supabase, periodo),
    buscarSocios(),
  ]);

  const cabecalho = (
    <CabecalhoPagina
      secao="Lucro dos sócios"
      titulo="Lucro dos sócios"
      subtitulo={
        socios
          ? `O que sobrou dos aluguéis depois das despesas, dividido em partes iguais entre os ${socios.length} sócios.`
          : "O que sobrou dos aluguéis depois das despesas, dividido entre os sócios."
      }
      acoes={<NavegarMes caminho="/lucro" mes={mes} />}
    />
  );

  if (!socios || socios.length === 0) {
    return (
      <>
        {cabecalho}
        <Painel titulo="Falta uma configuração">
          <p className="text-sm text-slate-700">
            Para saber quem são os sócios, o sistema precisa da chave secreta do Supabase (
            <code className="rounded bg-slate-100 px-1.5 py-0.5">SUPABASE_SECRET_KEY</code>) cadastrada na Vercel.
          </p>
        </Painel>
      </>
    );
  }

  const pagamentos = indexarPagamentos(pagamentosAno);
  const meses = Array.from({ length: 12 }, (_, i) => `${ano}-${String(i + 1).padStart(2, "0")}`);
  const linhas = meses.map((ym) => {
    const r = resumoDoMes(ym, imoveis, pagamentos, despesasAno, hoje);
    return { ym, recebido: r.recebido, despesas: r.despesas, lucro: r.liquido, partes: dividirIgual(r.liquido, socios.length) };
  });
  const doMes = linhas.find((l) => l.ym === mes)!;
  const totalAno = {
    recebido: linhas.reduce((s, l) => s + l.recebido, 0),
    despesas: linhas.reduce((s, l) => s + l.despesas, 0),
    lucro: linhas.reduce((s, l) => s + l.lucro, 0),
    partes: socios.map((_, i) => Math.round(linhas.reduce((s, l) => s + l.partes[i], 0) * 100) / 100),
  };
  const percentual = (100 / socios.length).toLocaleString("pt-BR", { maximumFractionDigits: 1 });
  const semMovimento = totalAno.recebido === 0 && totalAno.despesas === 0;

  return (
    <>
      {cabecalho}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Cartao titulo="Recebido no mês" valor={brl(doMes.recebido)} icone={Download} tom="verde" />
        <Cartao titulo="Despesas no mês" valor={brl(doMes.despesas)} icone={FileText} tom="vermelho" />
        <Cartao
          titulo={doMes.lucro < 0 ? "Prejuízo do mês" : "Lucro do mês"}
          valor={brl(doMes.lucro)}
          detalhe="Recebido − despesas"
          icone={HandCoins}
          tom={doMes.lucro < 0 ? "negativo" : "positivo"}
        />
        <Cartao
          titulo="Parte de cada sócio"
          valor={brl(doMes.partes[0] ?? 0)}
          detalhe={`${percentual}% para cada um dos ${socios.length}`}
          icone={Users}
          tom="azul"
        />
      </div>

      <Painel
        titulo={`Divisão de ${nomeDoMes(mes)}`}
        subtitulo={
          doMes.lucro < 0
            ? "As despesas passaram do que foi recebido: o valor negativo é o quanto cada sócio cobre."
            : "Valores recebidos no mês menos as despesas lançadas no mês. Aluguel em aberto só entra quando é pago."
        }
      >
        <ul className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
          {socios.map((s, i) => (
            <li key={s.id} className="flex items-center gap-4 rounded-xl border border-slate-100 bg-slate-50/60 p-4">
              <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-blue-100 text-base font-bold text-blue-700">
                {s.nome.charAt(0).toUpperCase()}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate font-semibold text-slate-900">
                  {s.nome}
                  {s.id === user.id && (
                    <span className="ml-2 rounded-full bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-700">você</span>
                  )}
                </span>
                <span className="block text-xs text-slate-500">{percentual}% do lucro</span>
              </span>
              <span className={`text-lg font-bold tabular-nums ${corValor(doMes.partes[i])}`}>{brl(doMes.partes[i])}</span>
            </li>
          ))}
        </ul>
      </Painel>

      <Painel titulo={`Acumulado em ${ano}`} subtitulo="Clique no mês para ver a divisão dele.">
        {semMovimento ? (
          <Vazio titulo={`Nenhum recebimento nem despesa em ${ano}`}>
            Quando os aluguéis forem registrados como pagos, o lucro e a parte de cada sócio aparecem aqui.
          </Vazio>
        ) : (
          <div className={tabelaCaixa}>
            <table className="w-full text-sm">
              <thead className={thead}>
                <tr>
                  <th className={th}>Mês</th>
                  <th className={`${th} text-right`}>Recebido</th>
                  <th className={`${th} text-right`}>Despesas</th>
                  <th className={`${th} text-right`}>Lucro</th>
                  {socios.map((s) => (
                    <th key={s.id} className={`${th} text-right normal-case tracking-normal`}>
                      {s.nome.split(" ")[0]}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {linhas.map((l) => (
                  <tr key={l.ym} className={l.ym === mes ? "bg-blue-50/60" : undefined}>
                    <td className={`${td} font-medium first-letter:uppercase`}>
                      <Link href={`/lucro?mes=${l.ym}`} className="hover:text-blue-700 hover:underline">
                        {nomeCurtoDoMes(l.ym)}
                      </Link>
                    </td>
                    <td className={`${tdValor} ${corValor(l.recebido)}`}>{brl(l.recebido)}</td>
                    <td className={`${tdValor} ${corDespesa(l.despesas)}`}>{brl(l.despesas)}</td>
                    <td className={`${tdValor} font-semibold ${corValor(l.lucro)}`}>{brl(l.lucro)}</td>
                    {l.partes.map((p, i) => (
                      <td key={socios[i].id} className={`${tdValor} ${corValor(p)}`}>
                        {brl(p)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
              <tfoot className="border-t-2 border-slate-200 bg-slate-50/60 font-bold">
                <tr>
                  <td className={td}>Total</td>
                  <td className={`${tdValor} ${corValor(totalAno.recebido)}`}>{brl(totalAno.recebido)}</td>
                  <td className={`${tdValor} ${corDespesa(totalAno.despesas)}`}>{brl(totalAno.despesas)}</td>
                  <td className={`${tdValor} ${corValor(totalAno.lucro)}`}>{brl(totalAno.lucro)}</td>
                  {totalAno.partes.map((p, i) => (
                    <td key={socios[i].id} className={`${tdValor} ${corValor(p)}`}>
                      {brl(p)}
                    </td>
                  ))}
                </tr>
              </tfoot>
            </table>
          </div>
        )}
        <p className="text-xs text-slate-500">
          Sócios são todas as pessoas com acesso ao sistema (tela Usuários). O lucro considera o dinheiro que
          entrou e saiu em cada mês.
        </p>
      </Painel>
    </>
  );
}
