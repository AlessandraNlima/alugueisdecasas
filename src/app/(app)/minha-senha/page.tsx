import { SubmitButton } from "@/components/submit-button";
import { Mensagem, Painel, botaoPrincipal, campo, rotulo } from "@/components/ui";
import { exigirUsuario } from "@/lib/dados";
import { trocarSenha } from "./actions";

function param(v: string | string[] | undefined) {
  return typeof v === "string" ? v : undefined;
}

export default async function MinhaSenhaPage({ searchParams }: PageProps<"/minha-senha">) {
  const sp = await searchParams;
  const { user } = await exigirUsuario();

  return (
    <>
      <h1 className="text-2xl font-bold text-slate-900">Minha senha</h1>
      <Mensagem ok={param(sp.ok)} erro={param(sp.erro)} />

      <Painel titulo={`Trocar a senha de ${user.email}`}>
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
