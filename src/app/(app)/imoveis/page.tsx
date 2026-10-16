import Link from "next/link";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { BotaoConfirmar } from "@/components/botao-confirmar";
import { SubmitButton } from "@/components/submit-button";
import {
  CabecalhoPagina,
  Etiqueta,
  IlustracaoCasa,
  Mensagem,
  Painel,
  Vazio,
  botaoDiscreto,
  botaoPerigo,
  botaoPrincipal,
  botaoSecundario,
  campo,
  rotulo,
  tabelaCaixa,
  td,
  tdValor,
  th,
  thead,
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
  const alugados = imoveis.filter((i) => i.ativo).length;

  return (
    <>
      <CabecalhoPagina
        secao="Imóveis"
        titulo="Imóveis"
        subtitulo="Cadastre seus imóveis, o valor do aluguel e os dados de cada inquilino."
        acoes={
          <a href="/imoveis#novo" className={`${botaoPrincipal} px-5 py-3 text-base`}>
            <Plus className="h-5 w-5" aria-hidden />
            Cadastrar imóvel
          </a>
        }
      />
      <Mensagem ok={param(sp.ok)} erro={param(sp.erro)} />

      <Painel
        id="novo"
        titulo={editando ? `Editar: ${editando.apelido}` : "Cadastrar imóvel"}
        subtitulo="Campos com * são obrigatórios."
      >
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

      <Painel
        titulo="Imóveis cadastrados"
        subtitulo={
          imoveis.length
            ? `${imoveis.length} no total · ${alugados} alugado${alugados === 1 ? "" : "s"}`
            : undefined
        }
      >
        {imoveis.length === 0 ? (
          <Vazio ilustracao={<IlustracaoCasa />} titulo="Nenhum imóvel ainda">
            Preencha o formulário acima para cadastrar o primeiro.
          </Vazio>
        ) : (
          <>
            <div className={tabelaCaixa}>
              <table className="w-full text-sm">
                <thead className={thead}>
                  <tr>
                    <th className={th}>Imóvel</th>
                    <th className={th}>Inquilino</th>
                    <th className={`${th} text-right`}>Aluguel</th>
                    <th className={th}>Vence dia</th>
                    <th className={th}>Desde</th>
                    <th className={th}>Situação</th>
                    <th className={th}>
                      <span className="sr-only">Ações</span>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {imoveis.map((i) => (
                    <tr key={i.id} className={i.id === editando?.id ? "bg-blue-50/50" : undefined}>
                      <td className={td}>
                        <p className="font-semibold text-slate-900">{i.apelido}</p>
                        <p className="text-xs text-slate-500">{i.endereco}</p>
                      </td>
                      <td className={td}>
                        <p className="text-slate-800">{i.inquilino_nome ?? "—"}</p>
                        <p className="text-xs text-slate-500">
                          {[i.inquilino_telefone, i.inquilino_cpf].filter(Boolean).join(" · ")}
                        </p>
                      </td>
                      <td className={`${tdValor} font-semibold text-slate-900`}>{brl(i.valor_aluguel)}</td>
                      <td className={`${td} tabular-nums`}>{i.dia_vencimento}</td>
                      <td className={`${td} whitespace-nowrap first-letter:uppercase`}>
                        {nomeDoMes(i.inicio_contrato.slice(0, 7))}
                      </td>
                      <td className={td}>
                        <Etiqueta tipo={i.ativo ? "pago" : "fora"}>{i.ativo ? "Alugado" : "Desocupado"}</Etiqueta>
                      </td>
                      <td className={`${td} whitespace-nowrap text-right`}>
                        <div className="inline-flex items-center gap-1">
                          <Link href={`/imoveis?editar=${i.id}#novo`} className={botaoDiscreto}>
                            <Pencil className="h-3.5 w-3.5" aria-hidden />
                            Editar
                          </Link>
                          <form action={excluirImovel}>
                            <input type="hidden" name="id" value={i.id} />
                            <BotaoConfirmar confirmar="Apagar tudo?" className={botaoPerigo}>
                              <Trash2 className="h-3.5 w-3.5" aria-hidden />
                              Excluir
                            </BotaoConfirmar>
                          </form>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="text-xs text-slate-500">
              Excluir um imóvel apaga também os pagamentos e despesas dele. Para guardar o histórico, edite e marque
              como <b>Desocupado</b>.
            </p>
          </>
        )}
      </Painel>
    </>
  );
}
