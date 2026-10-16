import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { gerarBackup, nomeArquivoBackup } from "@/lib/backup-servidor";

// Gera o backup na hora e entrega direto para o navegador baixar. Nada é
// gravado no servidor, então não ocupa espaço na Vercel nem no Supabase.
export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return new NextResponse("Não autenticado", { status: 401 });

  try {
    const backup = await gerarBackup(supabase, user.email ?? user.id);
    return new NextResponse(JSON.stringify(backup, null, 2), {
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        "Content-Disposition": `attachment; filename="${nomeArquivoBackup()}"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (e) {
    return new NextResponse(e instanceof Error ? e.message : "Erro ao gerar o backup", { status: 500 });
  }
}
