import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { SUPABASE_KEY, SUPABASE_URL } from "@/lib/supabase/config";
import { chaveSecretaConfigurada, createAdminClient } from "@/lib/supabase/admin";

// O Supabase gratuito pausa o projeto depois de 7 dias sem uso. A Vercel Cron
// chama esta rota uma vez por dia (ver vercel.json) e ela faz só uma contagem
// leve no banco, sem gravar nada, para o projeto nunca ficar 7 dias parado.
export async function GET(request: NextRequest) {
  const segredo = process.env.CRON_SECRET;
  if (!segredo || request.headers.get("authorization") !== `Bearer ${segredo}`) {
    return NextResponse.json({ erro: "Não autorizado" }, { status: 401 });
  }

  const cliente = chaveSecretaConfigurada()
    ? createAdminClient()
    : createClient(SUPABASE_URL, SUPABASE_KEY, { auth: { persistSession: false } });
  const { count, error } = await cliente.from("imoveis").select("id", { count: "exact", head: true });
  if (error) {
    console.error("Manter ativo: falha ao consultar o banco:", error.message);
    return NextResponse.json({ erro: error.message }, { status: 500 });
  }
  return NextResponse.json({ ok: true, imoveis: count ?? 0, em: new Date().toISOString() });
}
