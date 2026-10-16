-- Sistema de aluguéis: imóveis (com o inquilino atual), pagamentos mensais e
-- despesas. Cada linha pertence a quem a criou (owner_id) e o RLS garante que
-- cada conta só enxerga e altera os próprios dados.

create extension if not exists "pgcrypto";

create table imoveis (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  apelido text not null,
  endereco text,
  valor_aluguel numeric(12, 2) not null check (valor_aluguel > 0),
  dia_vencimento smallint not null check (dia_vencimento between 1 and 31),
  -- Sempre o dia 1 do mês em que o contrato começou: a partir dele o
  -- sistema passa a cobrar o aluguel todo mês.
  inicio_contrato date not null check (extract(day from inicio_contrato) = 1),
  inquilino_nome text,
  inquilino_telefone text,
  inquilino_cpf text,
  -- false = desocupado/contrato encerrado: para de gerar cobrança, mas o
  -- histórico continua no relatório.
  ativo boolean not null default true,
  observacoes text,
  criado_em timestamptz not null default now()
);

create table pagamentos (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  imovel_id uuid not null references imoveis(id) on delete cascade,
  -- Mês de referência do aluguel (dia 1), não a data em que foi pago.
  competencia date not null check (extract(day from competencia) = 1),
  valor numeric(12, 2) not null check (valor > 0),
  data_pagamento date not null,
  observacao text,
  criado_em timestamptz not null default now(),
  unique (imovel_id, competencia)
);

create table despesas (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  imovel_id uuid not null references imoveis(id) on delete cascade,
  data date not null,
  categoria text not null,
  descricao text,
  valor numeric(12, 2) not null check (valor > 0),
  criado_em timestamptz not null default now()
);

create index imoveis_owner_idx on imoveis (owner_id);
create index pagamentos_owner_competencia_idx on pagamentos (owner_id, competencia);
create index despesas_owner_data_idx on despesas (owner_id, data);

alter table imoveis enable row level security;
alter table pagamentos enable row level security;
alter table despesas enable row level security;

create policy "dono gerencia seus imóveis" on imoveis
  for all to authenticated
  using (owner_id = auth.uid())
  with check (owner_id = auth.uid());

-- O imóvel referenciado também precisa ser da mesma pessoa: sem isso daria
-- para lançar pagamento/despesa num imóvel de outra conta conhecendo o id.
create policy "dono gerencia seus pagamentos" on pagamentos
  for all to authenticated
  using (owner_id = auth.uid())
  with check (
    owner_id = auth.uid()
    and exists (select 1 from imoveis i where i.id = imovel_id and i.owner_id = auth.uid())
  );

create policy "dono gerencia suas despesas" on despesas
  for all to authenticated
  using (owner_id = auth.uid())
  with check (
    owner_id = auth.uid()
    and exists (select 1 from imoveis i where i.id = imovel_id and i.owner_id = auth.uid())
  );
