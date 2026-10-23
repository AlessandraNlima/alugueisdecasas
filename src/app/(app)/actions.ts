"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { exigirUsuario } from "@/lib/dados";
import {
  CATEGORIAS_DESPESA,
  caminhoSeguro,
  comMensagem,
  lerValor,
  mesValido,
} from "@/lib/alugueis";

const DATA_RE = /^\d{4}-\d{2}-\d{2}$/;

function texto(formData: FormData, campo: string): string | null {
  const v = String(formData.get(campo) ?? "").trim();
  return v === "" ? null : v;
}

function concluir(voltar: string, mensagem: string): never {
  revalidatePath("/", "layout");
  redirect(comMensagem(voltar, "ok", mensagem));
}

function falhar(voltar: string, mensagem: string): never {
  redirect(comMensagem(voltar, "erro", mensagem));
}

export async function salvarImovel(formData: FormData) {
  const { supabase } = await exigirUsuario();
  const id = texto(formData, "id");
  const voltar = id ? `/imoveis?editar=${id}` : "/imoveis";

  const apelido = texto(formData, "apelido");
  const valor = lerValor(formData.get("valor_aluguel"));
  const dia = Number(formData.get("dia_vencimento"));
  const inicio = mesValido(texto(formData, "inicio_contrato"));

  if (!apelido) falhar(voltar, "Dê um nome ao imóvel.");
  if (!valor) falhar(voltar, "Informe o valor do aluguel, por exemplo 1.500,00.");
  if (!Number.isInteger(dia) || dia < 1 || dia > 31) falhar(voltar, "O dia do vencimento vai de 1 a 31.");
  if (!inicio) falhar(voltar, "Informe o mês de início do contrato.");

  const dados = {
    apelido,
    endereco: texto(formData, "endereco"),
    valor_aluguel: valor,
    dia_vencimento: dia,
    inicio_contrato: `${inicio}-01`,
    inquilino_nome: texto(formData, "inquilino_nome"),
    inquilino_telefone: texto(formData, "inquilino_telefone"),
    inquilino_cpf: texto(formData, "inquilino_cpf"),
    ativo: formData.get("ativo") === "1",
    observacoes: texto(formData, "observacoes"),
  };

  const { error } = id
    ? await supabase.from("imoveis").update(dados).eq("id", id)
    : await supabase.from("imoveis").insert(dados);
  if (error) falhar(voltar, `Não foi possível salvar: ${error.message}`);

  concluir("/imoveis", id ? "Imóvel atualizado." : "Imóvel cadastrado.");
}

export async function excluirImovel(formData: FormData) {
  const { supabase } = await exigirUsuario();
  const id = texto(formData, "id");
  if (!id) falhar("/imoveis", "Imóvel não encontrado.");
  const { error } = await supabase.from("imoveis").delete().eq("id", id);
  if (error) falhar("/imoveis", `Não foi possível excluir: ${error.message}`);
  concluir("/imoveis", "Imóvel excluído, junto com os pagamentos e despesas dele.");
}

export async function registrarPagamento(formData: FormData) {
  const { supabase, user } = await exigirUsuario();
  const voltar = caminhoSeguro(formData.get("voltar"));
  const imovelId = texto(formData, "imovel_id");
  const mes = mesValido(texto(formData, "mes"));
  const valor = lerValor(formData.get("valor"));
  const data = texto(formData, "data_pagamento");

  if (!imovelId || !mes) falhar(voltar, "Pagamento sem imóvel ou mês.");
  if (!valor) falhar(voltar, "Informe o valor recebido, por exemplo 1.500,00.");
  if (!data || !DATA_RE.test(data)) falhar(voltar, "Informe a data do pagamento.");

  // Um pagamento por imóvel por mês: registrar de novo corrige o anterior.
  const { error } = await supabase.from("pagamentos").upsert(
    {
      imovel_id: imovelId,
      competencia: `${mes}-01`,
      valor,
      data_pagamento: data,
      observacao: texto(formData, "observacao"),
      owner_id: user.id,
    },
    { onConflict: "imovel_id,competencia" },
  );
  if (error) falhar(voltar, `Não foi possível registrar: ${error.message}`);
  concluir(voltar, "Pagamento registrado.");
}

export async function desfazerPagamento(formData: FormData) {
  const { supabase } = await exigirUsuario();
  const voltar = caminhoSeguro(formData.get("voltar"));
  const id = texto(formData, "id");
  if (!id) falhar(voltar, "Pagamento não encontrado.");
  const { error } = await supabase.from("pagamentos").delete().eq("id", id);
  if (error) falhar(voltar, `Não foi possível desfazer: ${error.message}`);
  concluir(voltar, "Pagamento desfeito.");
}

export async function lancarDespesa(formData: FormData) {
  const { supabase } = await exigirUsuario();
  const voltar = caminhoSeguro(formData.get("voltar"), "/despesas");
  // Vazio = despesa geral da sociedade, sem imóvel.
  const imovelId = texto(formData, "imovel_id");
  const data = texto(formData, "data");
  const valor = lerValor(formData.get("valor"));
  const categoria = texto(formData, "categoria");

  if (!data || !DATA_RE.test(data)) falhar(voltar, "Informe a data da despesa.");
  if (!valor) falhar(voltar, "Informe o valor, por exemplo 250,00.");
  if (!categoria || !CATEGORIAS_DESPESA.includes(categoria)) falhar(voltar, "Escolha o tipo da despesa.");

  const { error } = await supabase.from("despesas").insert({
    imovel_id: imovelId,
    data,
    valor,
    categoria,
    descricao: texto(formData, "descricao"),
  });
  if (error) {
    // 23502 = campo obrigatório vazio: o banco ainda não aceita despesa geral.
    falhar(
      voltar,
      error.code === "23502" && !imovelId
        ? "O banco ainda não aceita despesa geral. Rode no Supabase (SQL Editor) o arquivo supabase/migrations/20261023120000_despesa_geral.sql."
        : `Não foi possível lançar: ${error.message}`,
    );
  }
  // Vai para o mês da despesa, para ela aparecer na lista logo em seguida.
  concluir(`/despesas?mes=${data.slice(0, 7)}`, "Despesa lançada.");
}

export async function excluirDespesa(formData: FormData) {
  const { supabase } = await exigirUsuario();
  const voltar = caminhoSeguro(formData.get("voltar"), "/despesas");
  const id = texto(formData, "id");
  if (!id) falhar(voltar, "Despesa não encontrada.");
  const { error } = await supabase.from("despesas").delete().eq("id", id);
  if (error) falhar(voltar, `Não foi possível excluir: ${error.message}`);
  concluir(voltar, "Despesa excluída.");
}
