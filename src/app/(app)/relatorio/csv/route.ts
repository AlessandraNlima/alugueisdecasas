import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { ROTULO_DESPESA_GERAL, dataBR, hojeISO } from "@/lib/alugueis";
import { buscarDespesas, buscarImoveis, buscarNomesUsuarios, buscarPagamentos } from "@/lib/dados";

// Planilha do ano com um recebimento ou uma despesa por linha. Usa ";" e
// vírgula decimal, que é o que o Excel em português abre direto em colunas.
export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return new NextResponse("Não autenticado", { status: 401 });

  const anoParam = Number(request.nextUrl.searchParams.get("ano"));
  const ano = Number.isInteger(anoParam) && anoParam >= 2000 && anoParam <= 2100
    ? anoParam
    : Number(hojeISO().slice(0, 4));
  const periodo = { de: `${ano}-01-01`, ate: `${ano}-12-31` };

  const [imoveis, pagamentos, despesas, autores] = await Promise.all([
    buscarImoveis(supabase),
    buscarPagamentos(supabase, periodo),
    buscarDespesas(supabase, periodo),
    buscarNomesUsuarios(),
  ]);
  const porId = new Map(imoveis.map((i) => [i.id, i]));

  const q = (s: string | null | undefined) => `"${String(s ?? "").replace(/"/g, '""')}"`;
  const num = (n: number) => n.toFixed(2).replace(".", ",");

  const linhas = [
    ["Tipo", "Imóvel", "Inquilino", "Mês de referência", "Data", "Categoria", "Descrição", "Valor", "Lançado por"].map(q).join(";"),
  ];
  for (const p of pagamentos) {
    const imovel = porId.get(p.imovel_id);
    linhas.push(
      [
        q("Recebimento"),
        q(imovel?.apelido),
        q(imovel?.inquilino_nome),
        q(p.competencia.slice(0, 7)),
        q(dataBR(p.data_pagamento)),
        q("Aluguel"),
        q(p.observacao),
        num(Number(p.valor)),
        q(p.owner_id ? autores[p.owner_id] : ""),
      ].join(";"),
    );
  }
  for (const d of [...despesas].reverse()) {
    linhas.push(
      [
        q("Despesa"),
        q(d.imovel_id ? porId.get(d.imovel_id)?.apelido : ROTULO_DESPESA_GERAL),
        q(""),
        q(d.data.slice(0, 7)),
        q(dataBR(d.data)),
        q(d.categoria),
        q(d.descricao),
        num(-Number(d.valor)),
        q(d.owner_id ? autores[d.owner_id] : ""),
      ].join(";"),
    );
  }

  // BOM no início: sem ele o Excel lê o arquivo como Latin-1 e estraga os acentos.
  return new NextResponse("﻿" + linhas.join("\r\n"), {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="alugueis-${ano}.csv"`,
    },
  });
}
