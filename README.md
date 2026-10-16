# Sistema de Aluguéis

Controle simples de imóveis alugados: cadastro de imóveis e inquilinos,
lançamento dos aluguéis pagos a cada mês, despesas (IPTU, condomínio,
manutenção…), lista de atrasados e relatório anual com exportação para Excel.

Feito com Next.js + Supabase (banco e login), hospedado na Vercel.

## Telas

- **Mês**: previsto, recebido, despesas e líquido do mês. Cada imóvel aparece
  como *Pago*, *Em aberto* ou *Atrasado*, com o botão **Registrar pagamento**.
  Embaixo, todos os aluguéis vencidos sem pagamento desde o início de cada
  contrato.
- **Imóveis**: cadastro com endereço, valor, dia do vencimento, início do
  contrato e dados do inquilino. Imóvel desocupado para de gerar cobrança e
  mantém o histórico.
- **Despesas**: lançamento por imóvel e por mês.
- **Relatório**: os 12 meses do ano, o resultado de cada imóvel e o botão
  **Baixar planilha (CSV)**.
- **Minha senha** (clique no seu e-mail no topo): cada pessoa troca a própria
  senha.

Todas as pessoas cadastradas no Supabase veem e administram os mesmos dados.

## Como colocar no ar (uma vez só)

### 1. Supabase (banco de dados e login)

1. Em [supabase.com](https://supabase.com), crie um projeto novo (ex.: `alugueis`).
2. Abra **SQL Editor → New query**, cole todo o conteúdo de
   [`supabase/migrations/20261016120000_alugueis.sql`](supabase/migrations/20261016120000_alugueis.sql)
   e clique em **Run**. Depois, numa nova query, faça o mesmo com
   [`supabase/migrations/20261016130000_acesso_compartilhado.sql`](supabase/migrations/20261016130000_acesso_compartilhado.sql).
   Isso cria as tabelas `imoveis`, `pagamentos` e `despesas`, acessíveis só a
   quem tem login.
3. Em **Authentication → Users → Add user → Create new user**, crie o seu
   usuário (e-mail e senha). Marque **Auto Confirm User**.
4. Em **Authentication → Sign In / Providers**, desligue **Allow new users to
   sign up**. Assim só quem você cadastrar consegue entrar.
5. Clique no botão **Connect** (topo da página) → **Framework** → **Next.js** e
   copie as duas linhas da aba **.env.local**.

### 2. Vercel (hospedagem)

1. Em [vercel.com](https://vercel.com), clique em **Add New → Project** e
   importe este repositório do GitHub.
2. Antes de clicar em **Deploy**, abra **Environment Variables** e cole as duas
   linhas copiadas do Supabase (a Vercel separa nome e valor sozinha):
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` (o nome antigo
     `NEXT_PUBLIC_SUPABASE_ANON_KEY` também funciona)
3. Clique em **Deploy**. Quando terminar, abra o endereço que a Vercel mostrar
   e entre com o e-mail e a senha criados no Supabase.

Toda vez que algo for enviado para a branch `main` no GitHub, a Vercel publica
a nova versão sozinha.

## Dar acesso a outra pessoa

1. Supabase → **Authentication → Users → Add user → Create new user**.
2. E-mail da pessoa, uma senha provisória e **Auto Confirm User** marcado.
3. Envie para a pessoa o endereço do sistema, o e-mail e a senha provisória.
4. No primeiro acesso, ela clica no próprio e-mail no topo da tela
   (**Minha senha**) e cria uma senha só dela.

Para tirar o acesso: **Authentication → Users**, clique na pessoa →
**Delete user**. Os lançamentos que ela fez continuam no sistema.

## Rodar no computador (opcional)

```bash
cp .env.example .env.local   # preencha com os dados do Supabase
npm install
npm run dev                  # abre em http://localhost:3000
```
