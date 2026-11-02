import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

// Destino do link de "Esqueci minha senha": confirma o código com o Supabase,
// o que já deixa a pessoa logada, e leva para Minha conta criar a senha nova.
export async function GET(request: NextRequest) {
  const tokenHash = request.nextUrl.searchParams.get("token_hash");
  const type = request.nextUrl.searchParams.get("type");

  if (tokenHash && type === "recovery") {
    const supabase = await createClient();
    const { error } = await supabase.auth.verifyOtp({ type: "recovery", token_hash: tokenHash });
    if (!error) {
      const msg = encodeURIComponent("Link confirmado. Crie sua nova senha abaixo.");
      return NextResponse.redirect(new URL(`/minha-senha?ok=${msg}`, request.url));
    }
  }

  const erro = encodeURIComponent("Link inválido ou expirado. Peça um novo em Esqueci minha senha.");
  return NextResponse.redirect(new URL(`/login?error=${erro}`, request.url));
}
