"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { lerArquivoBackup, somenteColunas, type Linha } from "@/lib/backup";
import { buscarSocios, exigirUsuario } from "@/lib/dados";

const LIMITE_BYTES = 4 * 1024 * 1024;

function voltar(chave: "ok" | "erro", texto: string): never {
  redirect(`/backup?${chave}=${encodeURIComponent(texto)}`);
}

// Restaura mesclando: recoloca o que está no arquivo (inclusive o que foi
// apagado depois) e atualiza o que mudou, mas não apaga nada que foi lançado
// depois do backup. Pagamentos são casados por imóvel + mês.
export async function restaurarBackup(formData: FormData) {
  const { supabase, user } = await exigirUsuario();
  const arquivo = formData.get("arquivo");

  if (!(arquivo instanceof File) || arquivo.size === 0) voltar("erro", "Escolha o arquivo de backup (.json).");
  if (arquivo.size > LIMITE_BYTES) voltar("erro", "Arquivo grande demais para um backup deste sistema.");

  let backup;
  try {
    backup = lerArquivoBackup(await arquivo.text());
  } catch (e) {
    voltar("erro", e instanceof Error ? e.message : "Arquivo de backup inválido.");
  }

  // Quem lançou cada registro: se a pessoa não tem mais acesso, o registro
  // passa a constar como lançado por quem está restaurando.
  const socios = await buscarSocios().catch(() => null);
  const ativos = new Set((socios ?? []).map((s) => s.id));
  const autor = (l: Linha): Linha => ({
    ...l,
    owner_id: typeof l.owner_id === "string" && ativos.has(l.owner_id) ? l.owner_id : user.id,
  });

  const imoveis = backup.imoveis.map((l) => autor(somenteColunas("imoveis", l)));
  const pagamentos = backup.pagamentos.map((l) => autor(somenteColunas("pagamentos", l)));
  const despesas = backup.despesas.map((l) => autor(somenteColunas("despesas", l)));

  // Ordem importa: pagamentos e despesas dependem dos imóveis.
  if (imoveis.length) {
    const { error } = await supabase.from("imoveis").upsert(imoveis, { onConflict: "id" });
    if (error) voltar("erro", `Não foi possível restaurar os imóveis: ${error.message}`);
  }
  if (pagamentos.length) {
    const { error } = await supabase.from("pagamentos").upsert(pagamentos, { onConflict: "imovel_id,competencia" });
    if (error) voltar("erro", `Imóveis restaurados, mas os pagamentos falharam: ${error.message}`);
  }
  if (despesas.length) {
    const { error } = await supabase.from("despesas").upsert(despesas, { onConflict: "id" });
    if (error) voltar("erro", `Imóveis e pagamentos restaurados, mas as despesas falharam: ${error.message}`);
  }

  revalidatePath("/", "layout");
  const data = new Date(backup.gerado_em).toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" });
  voltar(
    "ok",
    `Backup de ${data} restaurado: ${imoveis.length} imóveis, ${pagamentos.length} pagamentos e ${despesas.length} despesas.`,
  );
}
