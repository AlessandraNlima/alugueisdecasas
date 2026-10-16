-- Equipe compartilhada: todas as contas criadas no projeto (Authentication →
-- Users) veem e administram os mesmos imóveis, pagamentos e despesas.
-- O cadastro aberto fica desligado no Supabase, então só entra quem for
-- adicionado lá. owner_id continua sendo gravado e passa a indicar quem
-- lançou o registro.

drop policy if exists "dono gerencia seus imóveis" on imoveis;
drop policy if exists "dono gerencia seus pagamentos" on pagamentos;
drop policy if exists "dono gerencia suas despesas" on despesas;

create policy "equipe gerencia imóveis" on imoveis
  for all to authenticated
  using (true)
  with check (true);

create policy "equipe gerencia pagamentos" on pagamentos
  for all to authenticated
  using (true)
  with check (true);

create policy "equipe gerencia despesas" on despesas
  for all to authenticated
  using (true)
  with check (true);
