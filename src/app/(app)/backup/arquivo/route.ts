import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { hojeISO } from "@/lib/alugueis";
import { SISTEMA_BACKUP, VERSAO_BACKUP, type ArquivoBackup } from "@/lib/backup";
import { buscarSocios } from "@/lib/dados";

// Gera o backup na hora e entrega direto para o navegador baixar. Nada é
// gravado no servidor, então não ocupa espaço na Vercel nem no Supabase.
export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return new NextResponse("Não autenticado", { status: 401 });

  const tudo = async (tabela: "imoveis" | "pagamentos" | "despesas") => {
    const { data, error } = await supabase.from(tabela).select("*").order("criado_em").limit(100000);
    if (error) throw new Error(`Erro ao ler ${tabela}: ${error.message}`);
    return data ?? [];
  };

  try {
    const [imoveis, pagamentos, despesas, socios] = await Promise.all([
      tudo("imoveis"),
      tudo("pagamentos"),
      tudo("despesas"),
      buscarSocios().catch(() => null),
    ]);
    const backup: ArquivoBackup = {
      sistema: SISTEMA_BACKUP,
      versao: VERSAO_BACKUP,
      gerado_em: new Date().toISOString(),
      gerado_por: user.email ?? user.id,
      imoveis,
      pagamentos,
      despesas,
      // Só para consulta: logins não são recriados na restauração.
      socios: socios ?? undefined,
    };
    return new NextResponse(JSON.stringify(backup, null, 2), {
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        "Content-Disposition": `attachment; filename="backup-alugueis-${hojeISO()}.json"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (e) {
    return new NextResponse(e instanceof Error ? e.message : "Erro ao gerar o backup", { status: 500 });
  }
}
