import { SubmitButton } from "@/components/submit-button";
import { CabecalhoPagina, Mensagem, Painel, botaoPrincipal, campo, rotulo } from "@/components/ui";
import { exigirUsuario } from "@/lib/dados";
import { salvarNome, trocarSenha } from "./actions";

function param(v: string | string[] | undefined) {
  return typeof v === "string" ? v : undefined;
}

export default async function MinhaSenhaPage({ searchParams }: PageProps<"/minha-senha">) {
  const sp = await searchParams;
  const { user } = await exigirUsuario();
  const nome = typeof user.user_metadata?.nome === "string" ? user.user_metadata.nome : "";

  return (
    <>
      <CabecalhoPagina
        secao="Minha conta"
        titulo="Minha conta"
        subtitulo={nome ? `${nome} · ${user.email}` : (user.email ?? undefined)}
      />
      <Mensagem ok={param(sp.ok)} erro={param(sp.erro)} />

      <Painel titulo="Meu nome" className="max-w-xl">
        <p className="text-sm text-slate-600">
          É o nome que aparece no menu e na lista de quem tem acesso ao sistema.
        </p>
        <form action={salvarNome} className="flex max-w-md flex-col gap-4 sm:flex-row sm:items-end">
          <label className={`${rotulo} flex-1`}>
            Nome
            <input
              name="nome"
              required
              maxLength={80}
              defaultValue={nome}
              placeholder="Ex.: Alessandra Nascimento"
              autoComplete="name"
              className={campo}
            />
          </label>
          <SubmitButton className={botaoPrincipal}>Salvar nome</SubmitButton>
        </form>
      </Painel>

      <Painel titulo="Trocar minha senha" className="max-w-xl">
        <p className="text-sm text-slate-600">
          Quem recebeu uma senha provisória deve trocá-la aqui no primeiro acesso.
        </p>
        <form action={trocarSenha} className="grid max-w-md gap-4">
          <label className={rotulo}>
            Nova senha
            <input
              name="senha"
              type="password"
              required
              minLength={6}
              autoComplete="new-password"
              className={campo}
            />
          </label>
          <label className={rotulo}>
            Repita a nova senha
            <input
              name="confirmacao"
              type="password"
              required
              minLength={6}
              autoComplete="new-password"
              className={campo}
            />
          </label>
          <div>
            <SubmitButton className={botaoPrincipal}>Salvar nova senha</SubmitButton>
          </div>
        </form>
      </Painel>
    </>
  );
}
