// Formato do arquivo de backup. O arquivo fica com os sócios (computador,
// Google Drive), nunca no Supabase ou na Vercel, para não ocupar espaço que
// possa sair do plano gratuito e para sobreviver a um problema no Supabase.

export const VERSAO_BACKUP = 1;
export const SISTEMA_BACKUP = "sistema-alugueis";

// Colunas restauradas de cada tabela. Qualquer outro campo do arquivo é
// ignorado, para um arquivo editado à mão não conseguir gravar outra coisa.
export const COLUNAS = {
  imoveis: [
    "id",
    "owner_id",
    "apelido",
    "endereco",
    "valor_aluguel",
    "dia_vencimento",
    "inicio_contrato",
    "inquilino_nome",
    "inquilino_telefone",
    "inquilino_cpf",
    "ativo",
    "observacoes",
    "criado_em",
  ],
  // Sem "id": o pagamento é identificado por imóvel + mês (um por mês).
  pagamentos: ["owner_id", "imovel_id", "competencia", "valor", "data_pagamento", "observacao", "criado_em"],
  despesas: ["id", "owner_id", "imovel_id", "data", "categoria", "descricao", "valor", "criado_em"],
} as const;

export type Tabela = keyof typeof COLUNAS;
export type Linha = Record<string, unknown>;

export type ArquivoBackup = {
  sistema: typeof SISTEMA_BACKUP;
  versao: number;
  gerado_em: string;
  gerado_por: string;
  imoveis: Linha[];
  pagamentos: Linha[];
  despesas: Linha[];
  socios?: { id: string; nome: string; email: string }[];
};

export function lerArquivoBackup(texto: string): ArquivoBackup {
  let dados: unknown;
  try {
    dados = JSON.parse(texto);
  } catch {
    throw new Error("O arquivo não é um backup válido (não foi possível ler o conteúdo).");
  }
  const d = dados as Partial<ArquivoBackup>;
  if (!d || d.sistema !== SISTEMA_BACKUP) {
    throw new Error("Este arquivo não é um backup do sistema de aluguéis.");
  }
  if (typeof d.versao !== "number" || d.versao > VERSAO_BACKUP) {
    throw new Error("Este backup foi gerado por uma versão mais nova do sistema.");
  }
  for (const t of ["imoveis", "pagamentos", "despesas"] as const) {
    if (!Array.isArray(d[t]) || d[t]!.some((l) => typeof l !== "object" || l === null)) {
      throw new Error(`O backup está incompleto (lista de ${t} inválida).`);
    }
  }
  return d as ArquivoBackup;
}

export function somenteColunas(tabela: Tabela, linha: Linha): Linha {
  const limpa: Linha = {};
  for (const c of COLUNAS[tabela]) if (c in linha) limpa[c] = linha[c];
  return limpa;
}
