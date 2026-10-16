import { SubmitButton } from "@/components/submit-button";
import { botaoPrincipal, campo, rotulo } from "@/components/ui";
import { signIn } from "./actions";

export default async function LoginPage({ searchParams }: PageProps<"/login">) {
  const { error } = await searchParams;

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-sm rounded-xl border-t-4 border-emerald-700 bg-white p-8 shadow-sm">
        <h1 className="text-xl font-semibold text-emerald-800">Aluguéis</h1>
        <p className="mt-1 text-sm text-slate-500">Controle de imóveis, recebimentos e despesas</p>

        <form action={signIn} className="mt-6 flex flex-col gap-4">
          <label className={rotulo}>
            E-mail
            <input name="email" type="email" required autoComplete="email" className={campo} />
          </label>
          <label className={rotulo}>
            Senha
            <input
              name="password"
              type="password"
              required
              autoComplete="current-password"
              className={campo}
            />
          </label>

          {typeof error === "string" && <p className="text-sm text-red-600">{error}</p>}

          <SubmitButton pendingText="Entrando..." className={`${botaoPrincipal} mt-2`}>
            Entrar
          </SubmitButton>
        </form>
      </div>
    </div>
  );
}
