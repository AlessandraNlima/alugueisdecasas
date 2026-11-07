import Link from "next/link";
import { HandCoins, Trash2 } from "lucide-react";
import { BotaoConfirmar } from "@/components/botao-confirmar";
import { SubmitButton } from "@/components/submit-button";
import {
  CabecalhoPagina,
  Mensagem,
  NavegarMes,
  Painel,
  Vazio,
  botaoPerigo,
  botaoPrincipal,
  campo,
  rotulo,
  tabelaCaixa,
  td,
  tdValor,
  th,
  thead,
} from "@/components/ui";
import {
  CATEGORIAS_RECEITA,
  ROTULO_DESPESA_GERAL,
  brl,
  dataBR,
  hojeISO,
  mesAtual,
  mesValido,
  nomeDoMes,
  vencimento,
} from "@/lib/alugueis";
import { buscarImoveis, buscarNomesUsuarios, buscarReceitas, exigirUsuario } from "@/lib/dados";
import { excluirReceita, lancarReceita } from "../actions";

function param(v: string | string[] | undefined) {
  return typeof v === "string" ? v : undefined;
}

export default async function ReceitasPage({ searchParams }: PageProps<"/receitas">) {
  const sp = await searchParams;
  const mes = mesValido(param(sp.mes)) ?? mesAtual();
  const hoje = hojeISO();
  const voltar = `/receitas?mes=${mes}`;

  const { supabase } = await exigirUsuario();
  const [imoveis, receitas, autores] = await Promise.all([
    buscarImoveis(supabase),
    buscarReceitas(supabase, { de: `${mes}-01`, ate: vencimento(mes, 31) }),
    buscarNomesUsuarios(),
  ]);
  const nomes = new Map(imoveis.map((i) => [i.id, i.apelido]));
  const total = receitas.reduce((s, d) => s + Number(d.valor), 0);

  return (
    <>
      <CabecalhoPagina
        secao="Receitas"
        titulo="Outras receitas"
        subtitulo="Dinheiro que entra além dos aluguéis: vendas, rendimentos, reembolsos, multas e outros."
        acoes={<NavegarMes caminho="/receitas" mes={mes} />}
      />
      <Mensagem ok={param(sp.ok)} erro={param(sp.erro)} />

      <Painel titulo="Lançar receita">
        <p className="text-sm text-slate-500">
          Os aluguéis continuam sendo registrados na <Link href="/" className="font-semibold text-blue-700 hover:underline">Visão geral</Link>.
          Aqui entram as outras entradas.
        </p>
        <form action={lancarReceita} className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <input type="hidden" name="voltar" value={voltar} />
          <label className={rotulo}>
            Imóvel
            <select name="imovel_id" className={campo}>
              <option value="">{ROTULO_DESPESA_GERAL}</option>
              {imoveis.map((i) => (
                <option key={i.id} value={i.id}>
                  {i.apelido}
                </option>
              ))}
            </select>
          </label>
          <label className={rotulo}>
            Tipo
            <select name="categoria" required className={campo}>
              {CATEGORIAS_RECEITA.map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>
          </label>
          <label className={rotulo}>
            Data
            <input
              name="data"
              type="date"
              required
              defaultValue={mes === hoje.slice(0, 7) ? hoje : `${mes}-01`}
              className={campo}
            />
          </label>
          <label className={rotulo}>
            Valor (R$)
            <input name="valor" required inputMode="decimal" placeholder="250,00" className={campo} />
          </label>
          <label className={`${rotulo} sm:col-span-2 lg:col-span-3`}>
            Descrição
            <input name="descricao" placeholder="Ex.: venda do fogão antigo" className={campo} />
          </label>
          <div className="flex items-end">
            <SubmitButton className={`${botaoPrincipal} w-full`}>Lançar receita</SubmitButton>
          </div>
        </form>
      </Painel>

      <Painel
        titulo={`Receitas de ${nomeDoMes(mes)}`}
        subtitulo={receitas.length ? `${receitas.length} lançamento${receitas.length === 1 ? "" : "s"}` : undefined}
        acao={
          <span className="rounded-full bg-emerald-50 px-3 py-1 text-sm font-bold text-emerald-700 tabular-nums">
            {brl(total)}
          </span>
        }
      >
        {receitas.length === 0 ? (
          <Vazio
            ilustracao={
              <span className="grid h-16 w-16 place-items-center rounded-2xl bg-emerald-50">
                <HandCoins className="h-8 w-8 text-emerald-500" aria-hidden />
              </span>
            }
            titulo="Nenhuma receita neste mês"
          >
            As receitas lançadas aparecem aqui. Use as setas do seletor para ver outros meses.
          </Vazio>
        ) : (
          <div className={tabelaCaixa}>
            <table className="w-full text-sm">
              <thead className={thead}>
                <tr>
                  <th className={th}>Data</th>
                  <th className={th}>Imóvel</th>
                  <th className={th}>Tipo</th>
                  <th className={th}>Descrição</th>
                  <th className={th}>Lançado por</th>
                  <th className={`${th} text-right`}>Valor</th>
                  <th className={th}>
                    <span className="sr-only">Ações</span>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {receitas.map((d) => (
                  <tr key={d.id}>
                    <td className={`${td} whitespace-nowrap tabular-nums`}>{dataBR(d.data)}</td>
                    <td className={`${td} font-medium text-slate-900`}>{d.imovel_id ? (nomes.get(d.imovel_id) ?? "—") : ROTULO_DESPESA_GERAL}</td>
                    <td className={td}>
                      <span className="rounded-md bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-700">
                        {d.categoria}
                      </span>
                    </td>
                    <td className={`${td} text-slate-600`}>{d.descricao}</td>
                    <td className={`${td} whitespace-nowrap text-slate-600`}>
                      {(d.owner_id && autores[d.owner_id]) || "—"}
                    </td>
                    <td className={`${tdValor} font-semibold text-emerald-700`}>{brl(d.valor)}</td>
                    <td className={`${td} text-right`}>
                      <form action={excluirReceita}>
                        <input type="hidden" name="id" value={d.id} />
                        <input type="hidden" name="voltar" value={voltar} />
                        <BotaoConfirmar confirmar="Confirmar?" className={botaoPerigo}>
                          <Trash2 className="h-3.5 w-3.5" aria-hidden />
                          Excluir
                        </BotaoConfirmar>
                      </form>
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
