-- Despesa geral: despesa da sociedade que não é de um imóvel específico
-- (contador, taxa bancária etc.). Fica com imovel_id vazio e entra no total
-- do mês e no lucro dos sócios como qualquer outra despesa.
alter table despesas alter column imovel_id drop not null;
