import { redirect } from "next/navigation";
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
    .select("id, imovel_id, competencia, valor, data_pagamento, observacao");
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
    .select("id, imovel_id, data, categoria, descricao, valor")
    .gte("data", filtro.de)
    .lte("data", filtro.ate)
    .order("data", { ascending: false });
  if (error) throw new Error(`Erro ao carregar despesas: ${error.message}`);
  return (data ?? []) as Despesa[];
}
