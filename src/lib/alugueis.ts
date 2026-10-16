// Regras do sistema que não dependem do banco: datas, dinheiro e a situação
// de cada aluguel no mês. "ym" é sempre um mês no formato AAAA-MM.

export type Imovel = {
  id: string;
  apelido: string;
  endereco: string | null;
  valor_aluguel: number;
  dia_vencimento: number;
  inicio_contrato: string; // AAAA-MM-01
  inquilino_nome: string | null;
  inquilino_telefone: string | null;
  inquilino_cpf: string | null;
  ativo: boolean;
  observacoes: string | null;
};

export type Pagamento = {
  id: string;
  imovel_id: string;
  competencia: string; // AAAA-MM-01
  valor: number;
  data_pagamento: string;
  observacao: string | null;
};

export type Despesa = {
  id: string;
  imovel_id: string;
  data: string;
  categoria: string;
  descricao: string | null;
  valor: number;
};

export const CATEGORIAS_DESPESA = [
  "IPTU",
  "Condomínio",
  "Água / Luz",
  "Manutenção",
  "Seguro",
  "Imposto de renda",
  "Taxa de administração",
  "Outros",
];

const YM_RE = /^\d{4}-(0[1-9]|1[0-2])$/;

// A Vercel roda em UTC: sem fixar o fuso, entre 21h e meia-noite o "hoje" já
// seria o dia seguinte e um aluguel apareceria atrasado um dia antes.
export function hojeISO(): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Sao_Paulo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

export function mesAtual(): string {
  return hojeISO().slice(0, 7);
}

export function mesValido(valor: string | undefined | null): string | null {
  return valor && YM_RE.test(valor) ? valor : null;
}

export function somarMeses(ym: string, n: number): string {
  const [y, m] = ym.split("-").map(Number);
  const total = y * 12 + (m - 1) + n;
  return `${Math.floor(total / 12)}-${String((total % 12) + 1).padStart(2, "0")}`;
}

const MESES = [
  "janeiro", "fevereiro", "março", "abril", "maio", "junho",
  "julho", "agosto", "setembro", "outubro", "novembro", "dezembro",
];

export function nomeDoMes(ym: string): string {
  const [y, m] = ym.split("-").map(Number);
  return `${MESES[m - 1]} de ${y}`;
}

export function nomeCurtoDoMes(ym: string): string {
  return MESES[Number(ym.slice(5, 7)) - 1].slice(0, 3);
}

export function dataBR(iso: string | null | undefined): string {
  if (!iso) return "";
  const [y, m, d] = iso.slice(0, 10).split("-");
  return `${d}/${m}/${y}`;
}

// Vencimento no dia 31 cai no último dia em meses mais curtos (ex.: 28/02).
export function vencimento(ym: string, dia: number): string {
  const [y, m] = ym.split("-").map(Number);
  const ultimo = new Date(Date.UTC(y, m, 0)).getUTCDate();
  return `${ym}-${String(Math.min(Math.max(1, dia), ultimo)).padStart(2, "0")}`;
}

export function diasEntre(deISO: string, ateISO: string): number {
  return Math.round((Date.parse(ateISO) - Date.parse(deISO)) / 86_400_000);
}

export function brl(valor: number | string | null | undefined): string {
  return (Number(valor) || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

// Aceita "1500", "1.500,00", "1500,5" e "R$ 1.500,00".
export function lerValor(texto: FormDataEntryValue | null): number | null {
  let s = String(texto ?? "").replace(/[R$\s]/g, "");
  if (s.includes(",")) s = s.replace(/\./g, "").replace(",", ".");
  const n = Number(s);
  return Number.isFinite(n) && n > 0 ? Math.round(n * 100) / 100 : null;
}

export function valorParaCampo(valor: number | null | undefined): string {
  return valor == null ? "" : Number(valor).toFixed(2).replace(".", ",");
}

export type Situacao =
  | { tipo: "pago"; pagamento: Pagamento }
  | { tipo: "aberto"; vence: string }
  | { tipo: "atrasado"; vence: string }
  | { tipo: "fora"; motivo: string };

export function situacaoNoMes(
  imovel: Imovel,
  ym: string,
  pagamento: Pagamento | undefined,
  hoje: string,
): Situacao {
  if (pagamento) return { tipo: "pago", pagamento };
  if (ym < imovel.inicio_contrato.slice(0, 7)) return { tipo: "fora", motivo: "Antes do contrato" };
  if (!imovel.ativo) return { tipo: "fora", motivo: "Desocupado" };
  const vence = vencimento(ym, imovel.dia_vencimento);
  return hoje > vence ? { tipo: "atrasado", vence } : { tipo: "aberto", vence };
}

export function chavePagamento(imovelId: string, ym: string): string {
  return `${imovelId}|${ym}`;
}

export function indexarPagamentos(pagamentos: Pagamento[]): Map<string, Pagamento> {
  return new Map(pagamentos.map((p) => [chavePagamento(p.imovel_id, p.competencia.slice(0, 7)), p]));
}

export type Atraso = { imovel: Imovel; ym: string; vence: string; dias: number };

// Todo mês desde o início do contrato (até o mês atual) que já venceu e não
// tem pagamento registrado.
export function listarAtrasos(
  imoveis: Imovel[],
  pagamentos: Map<string, Pagamento>,
  hoje: string,
): Atraso[] {
  const atual = hoje.slice(0, 7);
  const atrasos: Atraso[] = [];
  for (const imovel of imoveis) {
    if (!imovel.ativo) continue;
    for (let ym = imovel.inicio_contrato.slice(0, 7); ym <= atual; ym = somarMeses(ym, 1)) {
      const s = situacaoNoMes(imovel, ym, pagamentos.get(chavePagamento(imovel.id, ym)), hoje);
      if (s.tipo === "atrasado") {
        atrasos.push({ imovel, ym, vence: s.vence, dias: diasEntre(s.vence, hoje) });
      }
    }
  }
  return atrasos.sort((a, b) => a.vence.localeCompare(b.vence));
}

export type ResumoMes = {
  previsto: number;
  recebido: number;
  despesas: number;
  liquido: number;
  falta: number;
};

export function resumoDoMes(
  ym: string,
  imoveis: Imovel[],
  pagamentos: Map<string, Pagamento>,
  despesas: Despesa[],
  hoje: string,
): ResumoMes {
  let previsto = 0;
  let recebido = 0;
  let falta = 0;
  for (const imovel of imoveis) {
    const s = situacaoNoMes(imovel, ym, pagamentos.get(chavePagamento(imovel.id, ym)), hoje);
    if (s.tipo === "pago") {
      previsto += Number(imovel.valor_aluguel);
      recebido += Number(s.pagamento.valor);
    } else if (s.tipo !== "fora") {
      previsto += Number(imovel.valor_aluguel);
      falta += Number(imovel.valor_aluguel);
    }
  }
  const totalDespesas = despesas
    .filter((d) => d.data.startsWith(ym))
    .reduce((soma, d) => soma + Number(d.valor), 0);
  return { previsto, recebido, despesas: totalDespesas, liquido: recebido - totalDespesas, falta };
}

// Só aceita caminhos internos, para um ?voltar= vindo do formulário não virar
// redirecionamento para outro site.
export function caminhoSeguro(valor: FormDataEntryValue | null, padrao = "/"): string {
  const s = String(valor ?? "");
  return s.startsWith("/") && !s.startsWith("//") ? s : padrao;
}

export function comMensagem(caminho: string, chave: "ok" | "erro", texto: string): string {
  const url = new URL(caminho, "http://x");
  url.searchParams.delete("ok");
  url.searchParams.delete("erro");
  url.searchParams.set(chave, texto);
  return url.pathname + url.search;
}
