import { NextResponse, type NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { enviarBackupPorEmail } from "@/lib/backup-servidor";

// Chamado pela Vercel Cron toda segunda de manhã (ver vercel.json). Roda sem
// login, com o cliente administrativo, por isso exige sempre o CRON_SECRET:
// sem ele configurado a rota fica fechada, nunca aberta.
export async function GET(request: NextRequest) {
  const segredo = process.env.CRON_SECRET;
  if (!segredo || request.headers.get("authorization") !== `Bearer ${segredo}`) {
    return NextResponse.json({ erro: "Não autorizado" }, { status: 401 });
  }

  try {
    const r = await enviarBackupPorEmail(createAdminClient(), "envio automático semanal", "envio automático semanal");
    return NextResponse.json({
      ok: true,
      destinatarios: r.para.length,
      imoveis: r.imoveis,
      pagamentos: r.pagamentos,
      despesas: r.despesas,
    });
  } catch (e) {
    console.error("Falha no backup automático:", e);
    return NextResponse.json({ erro: e instanceof Error ? e.message : "Falha no envio" }, { status: 500 });
  }
}
