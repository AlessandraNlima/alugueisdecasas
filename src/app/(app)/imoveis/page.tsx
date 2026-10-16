import Link from "next/link";
import { BotaoConfirmar } from "@/components/botao-confirmar";
import { SubmitButton } from "@/components/submit-button";
import {
  Etiqueta,
  Mensagem,
  Painel,
  Vazio,
  botaoPrincipal,
  botaoSecundario,
  campo,
  rotulo,
  td,
  tdValor,
  th,
} from "@/components/ui";
import { brl, mesAtual, nomeDoMes, valorParaCampo } from "@/lib/alugueis";
import { buscarImoveis, exigirUsuario } from "@/lib/dados";
import { excluirImovel, salvarImovel } from "../actions";

function param(v: string | string[] | undefined) {
  return typeof v === "string" ? v : undefined;
}

export default async function ImoveisPage({ searchParams }: PageProps<"/imoveis">) {
  const sp = await searchParams;
  const { supabase } = await exigirUsuario();
  const imoveis = await buscarImoveis(supabase);
  const editando = imoveis.find((i) => i.id === param(sp.editar));

  return (
    <>
      <h1 className="text-2xl font-bold text-slate-900">Imóveis</h1>
      <Mensagem ok={param(sp.ok)} erro={param(sp.erro)} />

      <Painel titulo={editando ? `Editar: ${editando.apelido}` : "Cadastrar imóvel"}>
        {/* key: troca de imóvel em edição precisa remontar o form, senão os
            defaultValue continuam com os dados do anterior. */}
        <form
          key={editando?.id ?? "novo"}
          action={salvarImovel}
          className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3"
        >
          {editando && <input type="hidden" name="id" value={editando.id} />}
          <label className={rotulo}>
            Nome do imóvel *
            <input
              name="apelido"
              required
              placeholder="Ex.: Casa da Rua das Flores"
              defaultValue={editando?.apelido}
              className={campo}
            />
          </label>
          <label className={`${rotulo} lg:col-span-2`}>
            Endereço
            <input
              name="endereco"
              placeholder="Rua, número, bairro, cidade"
              defaultValue={editando?.endereco ?? ""}
              className={campo}
            />
          </label>
          <label className={rotulo}>
            Aluguel mensal (R$) *
            <input
              name="valor_aluguel"
              required
              inputMode="decimal"
              placeholder="1.500,00"
              defaultValue={valorParaCampo(editando?.valor_aluguel)}
              className={campo}
            />
          </label>
          <label className={rotulo}>
            Dia do vencimento *
            <input
              name="dia_vencimento"
              type="number"
              min={1}
              max={31}
              required
              defaultValue={editando?.dia_vencimento ?? 10}
              className={campo}
            />
          </label>
          <label className={rotulo}>
            Início do contrato *
            <input
              name="inicio_contrato"
              type="month"
              required
              defaultValue={editando?.inicio_contrato.slice(0, 7) ?? mesAtual()}
              className={campo}
            />
          </label>
          <label className={rotulo}>
            Inquilino
            <input
              name="inquilino_nome"
              placeholder="Nome completo"
              defaultValue={editando?.inquilino_nome ?? ""}
              className={campo}
            />
          </label>
          <label className={rotulo}>
            Telefone
            <input
              name="inquilino_telefone"
              inputMode="tel"
              placeholder="(00) 00000-0000"
              defaultValue={editando?.inquilino_telefone ?? ""}
              className={campo}
            />
          </label>
          <label className={rotulo}>
            CPF
            <input
              name="inquilino_cpf"
              inputMode="numeric"
              placeholder="000.000.000-00"
              defaultValue={editando?.inquilino_cpf ?? ""}
              className={campo}
            />
          </label>
          <label className={rotulo}>
            Situação
            <select name="ativo" defaultValue={editando?.ativo === false ? "0" : "1"} className={campo}>
              <option value="1">Alugado</option>
              <option value="0">Desocupado / contrato encerrado</option>
            </select>
          </label>
          <label className={`${rotulo} sm:col-span-2`}>
            Observações
            <input
              name="observacoes"
              placeholder="Ex.: reajuste pelo IGP-M em março"
              defaultValue={editando?.observacoes ?? ""}
              className={campo}
            />
          </label>
          <div className="flex flex-wrap gap-2 sm:col-span-2 lg:col-span-3">
            <SubmitButton className={botaoPrincipal}>
              {editando ? "Salvar alterações" : "Cadastrar imóvel"}
            </SubmitButton>
            {editando && (
              <Link href="/imoveis" className={botaoSecundario}>
                Cancelar
              </Link>
            )}
          </div>
        </form>
      </Painel>

      <Painel titulo="Imóveis cadastrados">
        {imoveis.length === 0 ? (
          <Vazio>Nenhum imóvel ainda. Preencha o formulário acima para cadastrar o primeiro.</Vazio>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b border-slate-200">
                  <tr>
                    <th className={th}>Imóvel</th>
                    <th className={th}>Inquilino</th>
                    <th className={`${th} text-right`}>Aluguel</th>
                    <th className={th}>Vence dia</th>
                    <th className={th}>Desde</th>
                    <th className={th}>Situação</th>
                    <th className={th} />
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {imoveis.map((i) => (
                    <tr key={i.id}>
                      <td className={td}>
                        <p className="font-medium text-slate-900">{i.apelido}</p>
                        <p className="text-xs text-slate-500">{i.endereco}</p>
                      </td>
                      <td className={td}>
                        <p>{i.inquilino_nome ?? "—"}</p>
                        <p className="text-xs text-slate-500">
                          {[i.inquilino_telefone, i.inquilino_cpf].filter(Boolean).join(" · ")}
                        </p>
                      </td>
                      <td className={tdValor}>{brl(i.valor_aluguel)}</td>
                      <td className={`${td} font-mono tabular-nums`}>{i.dia_vencimento}</td>
                      <td className={`${td} whitespace-nowrap first-letter:uppercase`}>
                        {nomeDoMes(i.inicio_contrato.slice(0, 7))}
                      </td>
                      <td className={td}>
                        <Etiqueta tipo={i.ativo ? "pago" : "fora"}>{i.ativo ? "Alugado" : "Desocupado"}</Etiqueta>
                      </td>
                      <td className={`${td} whitespace-nowrap text-right`}>
                        <Link
                          href={`/imoveis?editar=${i.id}`}
                          className="rounded px-2 py-1 text-xs font-medium text-emerald-700 hover:bg-emerald-50"
                        >
                          Editar
                        </Link>
                        <form action={excluirImovel} className="inline">
                          <input type="hidden" name="id" value={i.id} />
                          <BotaoConfirmar
                            confirmar="Apagar tudo?"
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
            <p className="text-xs text-slate-500">
              Excluir um imóvel apaga também os pagamentos e despesas dele. Para guardar o histórico,
              edite e marque como <b>Desocupado</b>.
            </p>
          </>
        )}
      </Painel>
    </>
  );
}
