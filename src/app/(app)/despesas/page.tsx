import Link from "next/link";
import { BotaoConfirmar } from "@/components/botao-confirmar";
import { SubmitButton } from "@/components/submit-button";
import {
  Mensagem,
  NavegarMes,
  Painel,
  Vazio,
  botaoPrincipal,
  campo,
  rotulo,
  td,
  tdValor,
  th,
} from "@/components/ui";
import {
  CATEGORIAS_DESPESA,
  brl,
  dataBR,
  hojeISO,
  mesAtual,
  mesValido,
  nomeDoMes,
  vencimento,
} from "@/lib/alugueis";
import { buscarDespesas, buscarImoveis, exigirUsuario } from "@/lib/dados";
import { excluirDespesa, lancarDespesa } from "../actions";

function param(v: string | string[] | undefined) {
  return typeof v === "string" ? v : undefined;
}

export default async function DespesasPage({ searchParams }: PageProps<"/despesas">) {
  const sp = await searchParams;
  const mes = mesValido(param(sp.mes)) ?? mesAtual();
  const hoje = hojeISO();
  const voltar = `/despesas?mes=${mes}`;

  const { supabase } = await exigirUsuario();
  const [imoveis, despesas] = await Promise.all([
    buscarImoveis(supabase),
    buscarDespesas(supabase, { de: `${mes}-01`, ate: vencimento(mes, 31) }),
  ]);
  const nomes = new Map(imoveis.map((i) => [i.id, i.apelido]));
  const total = despesas.reduce((s, d) => s + Number(d.valor), 0);

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold text-slate-900">Despesas</h1>
        <NavegarMes caminho="/despesas" mes={mes} />
      </div>
      <Mensagem ok={param(sp.ok)} erro={param(sp.erro)} />

      <Painel titulo="Lançar despesa">
        {imoveis.length === 0 ? (
          <Vazio>
            <Link href="/imoveis" className="font-medium text-emerald-700 underline">
              Cadastre um imóvel
            </Link>{" "}
            antes de lançar despesas.
          </Vazio>
        ) : (
          <form action={lancarDespesa} className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <input type="hidden" name="voltar" value={voltar} />
            <label className={rotulo}>
              Imóvel
              <select name="imovel_id" required className={campo}>
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
                {CATEGORIAS_DESPESA.map((c) => (
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
              <input name="descricao" placeholder="Ex.: troca do chuveiro" className={campo} />
            </label>
            <div className="flex items-end">
              <SubmitButton className={`${botaoPrincipal} w-full`}>Lançar despesa</SubmitButton>
            </div>
          </form>
        )}
      </Painel>

      <Painel
        titulo={`Despesas de ${nomeDoMes(mes)}`}
        acao={<span className="font-mono font-semibold tabular-nums">{brl(total)}</span>}
      >
        {despesas.length === 0 ? (
          <Vazio>Nenhuma despesa lançada neste mês.</Vazio>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-slate-200">
                <tr>
                  <th className={th}>Data</th>
                  <th className={th}>Imóvel</th>
                  <th className={th}>Tipo</th>
                  <th className={th}>Descrição</th>
                  <th className={`${th} text-right`}>Valor</th>
                  <th className={th} />
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {despesas.map((d) => (
                  <tr key={d.id}>
                    <td className={`${td} font-mono tabular-nums`}>{dataBR(d.data)}</td>
                    <td className={td}>{nomes.get(d.imovel_id) ?? "—"}</td>
                    <td className={td}>{d.categoria}</td>
                    <td className={td}>{d.descricao}</td>
                    <td className={tdValor}>{brl(d.valor)}</td>
                    <td className={`${td} text-right`}>
                      <form action={excluirDespesa}>
                        <input type="hidden" name="id" value={d.id} />
                        <input type="hidden" name="voltar" value={voltar} />
                        <BotaoConfirmar
                          confirmar="Confirmar?"
                          className="rounded px-2 py-1 text-xs text-slate-500 hover:bg-red-50 hover:text-red-700"
                        >
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
