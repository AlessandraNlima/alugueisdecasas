import { House } from "lucide-react";
import { SubmitButton } from "@/components/submit-button";
import { botaoPrincipal, campo, rotulo, sombra } from "@/components/ui";
import { signIn } from "./actions";

export default async function LoginPage({ searchParams }: PageProps<"/login">) {
  const { error } = await searchParams;

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-blue-50/70 to-transparent px-4 py-10">
      <div className="w-full max-w-sm">
        <div className="mb-6 flex items-center justify-center gap-3">
          <House className="h-10 w-10 text-blue-600" strokeWidth={2.4} aria-hidden />
          <span className="leading-tight">
            <span className="block text-2xl font-extrabold tracking-tight text-slate-900">Aluguéis</span>
            <span className="block text-[0.7rem] font-semibold uppercase tracking-[0.14em] text-slate-500">
              Gestão de imóveis
            </span>
          </span>
        </div>

        <div className={`rounded-2xl border border-slate-200/70 bg-white p-8 ${sombra}`}>
          <h1 className="text-xl font-bold text-slate-900">Entrar</h1>
          <p className="mt-1 text-sm text-slate-500">Acompanhe os recebimentos e mantenha tudo em dia.</p>

          <form action={signIn} className="mt-6 flex flex-col gap-4">
            <label className={rotulo}>
              E-mail
              <input name="email" type="email" required autoComplete="email" className={campo} />
            </label>
            <label className={rotulo}>
              Senha
              <input name="password" type="password" required autoComplete="current-password" className={campo} />
            </label>

            {typeof error === "string" && (
              <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
                {error}
              </p>
            )}

            <SubmitButton pendingText="Entrando..." className={`${botaoPrincipal} mt-2 w-full py-3`}>
              Entrar
            </SubmitButton>
          </form>
        </div>

        <p className="mt-6 text-center text-xs text-slate-500">
          Esqueceu a senha? Peça para quem administra o sistema gerar uma nova em <b>Usuários</b>.
        </p>
      </div>
    </div>
  );
}
