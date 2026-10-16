import "server-only";
import { createClient } from "@supabase/supabase-js";
import { SUPABASE_URL } from "./config";

// Chave secreta do Supabase: dá poder total sobre o projeto (criar e apagar
// logins), por isso só existe no servidor e nunca leva o prefixo
// NEXT_PUBLIC_. O painel novo chama de "secret key" (sb_secret_...); o
// antigo, de "service_role".
const CHAVE_SECRETA = process.env.SUPABASE_SECRET_KEY ?? process.env.SUPABASE_SERVICE_ROLE_KEY;

export function chaveSecretaConfigurada(): boolean {
  return Boolean(CHAVE_SECRETA);
}

export function createAdminClient() {
  if (!CHAVE_SECRETA) {
    throw new Error("SUPABASE_SECRET_KEY não configurada na Vercel.");
  }
  return createClient(SUPABASE_URL, CHAVE_SECRETA, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
