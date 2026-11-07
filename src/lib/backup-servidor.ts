import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { hojeISO, dataBR } from "@/lib/alugueis";
import { SISTEMA_BACKUP, VERSAO_BACKUP, type ArquivoBackup } from "@/lib/backup";
import { buscarSocios, tabelaReceitasAusente } from "@/lib/dados";
import { emailConfigurado, enviarEmail } from "@/lib/email";

export { emailConfigurado };

// Monta o backup lendo as tabelas com o cliente recebido: o do usuário logado
// (botão Baixar) ou o administrativo (envio automático, que roda sem login).
export async function gerarBackup(cliente: SupabaseClient, geradoPor: string): Promise<ArquivoBackup> {
  const tudo = async (tabela: "imoveis" | "pagamentos" | "despesas" | "receitas") => {
    const { data, error } = await cliente.from(tabela).select("*").order("criado_em").limit(100000);
    if (error) {
      // Sem o SQL de receitas rodado, a tabela não existe: backup sai sem ela.
      if (tabela === "receitas" && tabelaReceitasAusente(error)) return [];
      throw new Error(`Erro ao ler ${tabela}: ${error.message}`);
    }
    return data ?? [];
  };
  const [imoveis, pagamentos, despesas, receitas, socios] = await Promise.all([
    tudo("imoveis"),
    tudo("pagamentos"),
    tudo("despesas"),
    tudo("receitas"),
    buscarSocios().catch(() => null),
  ]);
  return {
    sistema: SISTEMA_BACKUP,
    versao: VERSAO_BACKUP,
    gerado_em: new Date().toISOString(),
    gerado_por: geradoPor,
    imoveis,
    pagamentos,
    despesas,
    receitas,
    // Só para consulta: logins não são recriados na restauração.
    socios: socios ?? undefined,
  };
}

export function nomeArquivoBackup() {
  return `backup-alugueis-${hojeISO()}.json`;
}

// Destinatários: BACKUP_EMAIL_PARA (separados por vírgula) ou, sem ela,
// todos os sócios com acesso ao sistema.
export async function destinatariosBackup(): Promise<string[]> {
  const fixo = (process.env.BACKUP_EMAIL_PARA ?? "")
    .split(",")
    .map((e) => e.trim())
    .filter(Boolean);
  if (fixo.length) return fixo;
  const socios = await buscarSocios().catch(() => null);
  return (socios ?? []).map((s) => s.email).filter(Boolean);
}

export async function enviarBackupPorEmail(cliente: SupabaseClient, geradoPor: string, motivo: string) {
  if (!emailConfigurado()) {
    throw new Error("Envio de e-mail não configurado (faltam GMAIL_USER e GMAIL_APP_PASSWORD na Vercel).");
  }
  const para = await destinatariosBackup();
  if (para.length === 0) throw new Error("Nenhum destinatário para o backup.");

  const backup = await gerarBackup(cliente, geradoPor);
  const hoje = dataBR(hojeISO());
  const texto = [
    `Backup do sistema de aluguéis de ${hoje} (${motivo}).`,
    "",
    `Imóveis: ${backup.imoveis.length}`,
    `Pagamentos: ${backup.pagamentos.length}`,
    `Despesas: ${backup.despesas.length}`,
    `Outras receitas: ${backup.receitas?.length ?? 0}`,
    "",
    "Guarde o arquivo anexo na pasta de backups dos sócios no Google Drive.",
    "Para restaurar: no sistema, menu Backup → Restaurar backup → escolha este arquivo.",
    "",
    "O anexo tem CPF e telefone dos inquilinos: não encaminhe para fora da sociedade.",
  ].join("\n");

  await enviarEmail({
    to: para.join(", "),
    subject: `Backup do sistema de aluguéis – ${hoje}`,
    text: texto,
    attachments: [
      {
        filename: nomeArquivoBackup(),
        content: JSON.stringify(backup, null, 2),
        contentType: "application/json; charset=utf-8",
      },
    ],
  });

  return {
    para,
    imoveis: backup.imoveis.length,
    pagamentos: backup.pagamentos.length,
    despesas: backup.despesas.length,
  };
}
