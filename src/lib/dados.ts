import { redirect } from "next/navigation";
import { chaveSecretaConfigurada, createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import type { Despesa, Imovel, Pagamento } from "@/lib/alugueis";

type Supabase = Awaited<ReturnType<typeof createClient>>;

// Defesa extra além do proxy: toda página e toda Server Action confere o
// usuário de novo, porque Server Actions podem ser chamadas por POST direto.
export async function exigirUsuario() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  return { supabase, user };
}

export async function buscarImoveis(supabase: Supabase): Promise<Imovel[]> {
  const { data, error } = await supabase
    .from("imoveis")
    .select("*")
    .order("apelido", { ascending: true });
  if (error) throw new Error(`Erro ao carregar imóveis: ${error.message}`);
  return (data ?? []) as Imovel[];
}

export async function buscarPagamentos(
  supabase: Supabase,
  filtro?: { de: string; ate: string },
): Promise<Pagamento[]> {
  let q = supabase
    .from("pagamentos")
    .select("id, imovel_id, competencia, valor, data_pagamento, observacao, owner_id, criado_em");
  if (filtro) q = q.gte("competencia", filtro.de).lte("competencia", filtro.ate);
  const { data, error } = await q.order("competencia", { ascending: true });
  if (error) throw new Error(`Erro ao carregar pagamentos: ${error.message}`);
  return (data ?? []) as Pagamento[];
}

export async function buscarDespesas(
  supabase: Supabase,
  filtro: { de: string; ate: string },
): Promise<Despesa[]> {
  const { data, error } = await supabase
    .from("despesas")
    .select("id, imovel_id, data, categoria, descricao, valor, owner_id, criado_em")
    .gte("data", filtro.de)
    .lte("data", filtro.ate)
    .order("data", { ascending: false });
  if (error) throw new Error(`Erro ao carregar despesas: ${error.message}`);
  return (data ?? []) as Despesa[];
}

// Nome de cada sócio (Minha conta → Meu nome), ou o e-mail de quem ainda não
// definiu, para mostrar "por Fulano" nos lançamentos. A lista de logins só é
// acessível com a chave secreta; sem ela os lançamentos aparecem sem autor.
export async function buscarNomesUsuarios(): Promise<Record<string, string>> {
  if (!chaveSecretaConfigurada()) return {};
  try {
    const { data } = await createAdminClient().auth.admin.listUsers({ perPage: 200 });
    const nomes: Record<string, string> = {};
    for (const u of data?.users ?? []) {
      const nome = typeof u.user_metadata?.nome === "string" ? u.user_metadata.nome.trim() : "";
      nomes[u.id] = nome ? nome.split(" ")[0] : (u.email ?? "").split("@")[0] || "outro usuário";
    }
    return nomes;
  } catch {
    return {};
  }
}

export type Socio = { id: string; nome: string; email: string };

// Sócios = todas as pessoas com acesso ao sistema (tela Usuários), em ordem
// alfabética. null quando a chave secreta não está configurada.
export async function buscarSocios(): Promise<Socio[] | null> {
  if (!chaveSecretaConfigurada()) return null;
  const { data, error } = await createAdminClient().auth.admin.listUsers({ perPage: 200 });
  if (error) throw new Error(`Erro ao carregar sócios: ${error.message}`);
  return (data?.users ?? [])
    .map((u) => {
      const nome = typeof u.user_metadata?.nome === "string" ? u.user_metadata.nome.trim() : "";
      return { id: u.id, nome: nome || (u.email ?? "").split("@")[0], email: u.email ?? "" };
    })
    .sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR"));
}
