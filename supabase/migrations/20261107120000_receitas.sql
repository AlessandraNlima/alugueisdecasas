-- Outras receitas: dinheiro que entra sem ser aluguel (venda, rendimento,
-- reembolso, multa...). Pode ser de um imóvel ou geral (imovel_id vazio).
-- Entra no saldo do mês, no lucro dos sócios e no relatório.
create table if not exists receitas (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  imovel_id uuid references imoveis(id) on delete cascade,
  data date not null,
  categoria text not null,
  descricao text,
  valor numeric(12, 2) not null check (valor > 0),
  criado_em timestamptz not null default now()
);

create index if not exists receitas_data_idx on receitas (data);

alter table receitas enable row level security;

-- Mesma regra das outras tabelas: todos os sócios com login veem e alteram.
drop policy if exists "equipe gerencia receitas" on receitas;
create policy "equipe gerencia receitas" on receitas
  for all to authenticated
  using (true)
  with check (true);
