// O painel do Supabase hoje entrega a chave pública como
// NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY; projetos mais antigos usam
// NEXT_PUBLIC_SUPABASE_ANON_KEY. Aceita os dois nomes para dar para colar o
// bloco do botão "Connect" na Vercel sem renomear nada.
export const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
export const SUPABASE_KEY =
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
