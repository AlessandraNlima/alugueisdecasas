import Link from "next/link";
import { House, MailCheck } from "lucide-react";
import { SubmitButton } from "@/components/submit-button";
import { botaoPrincipal, campo, rotulo, sombra } from "@/components/ui";
import { pedirLinkDeSenha } from "./actions";

export default async function EsqueciSenhaPage({ searchParams }: PageProps<"/esqueci-senha">) {
  const { enviado, erro, indisponivel } = await searchParams;

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-blue-50/70 to-transparent px-4 py-10">
      <div className="w-full max-w-sm">
        <div className="mb-6 flex items-center justify-center gap-3">
          <House className="h-10 w-10 text-blue-600" strokeWidth={2.4} aria-hidden />
          <span className="text-2xl font-extrabold tracking-tight text-slate-900">Aluguéis</span>
        </div>

        <div className={`rounded-2xl border border-slate-200/70 bg-white p-8 ${sombra}`}>
          <h1 className="text-xl font-bold text-slate-900">Esqueci minha senha</h1>

          {enviado ? (
            <div className="mt-4 flex flex-col items-center gap-3 text-center">
              <span className="grid h-14 w-14 place-items-center rounded-full bg-emerald-50 text-emerald-600">
                <MailCheck className="h-7 w-7" aria-hidden />
              </span>
              <p className="text-sm text-slate-700">
                Se esse e-mail tiver acesso ao sistema, enviamos um link para criar uma senha nova. Confira a caixa de
                entrada e o spam. O link vale por 1 hora.
              </p>
            </div>
          ) : indisponivel ? (
            <p className="mt-4 rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-800">
              O envio de e-mail ainda não está configurado neste sistema. Peça para um sócio abrir <b>Usuários</b> e
              clicar em <b>Nova senha</b> na sua linha: ele recebe uma senha provisória para te passar.
            </p>
          ) : (
            <>
              <p className="mt-1 text-sm text-slate-500">Informe seu e-mail e enviaremos um link para criar uma senha nova.</p>
              <form action={pedirLinkDeSenha} className="mt-6 flex flex-col gap-4">
                <label className={rotulo}>
                  E-mail
                  <input name="email" type="email" required autoComplete="email" className={campo} />
                </label>
                {typeof erro === "string" && (
                  <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
                    {erro}
                  </p>
                )}
                <SubmitButton pendingText="Enviando..." className={`${botaoPrincipal} w-full py-3`}>
                  Enviar link
                </SubmitButton>
              </form>
            </>
          )}
        </div>

        <p className="mt-6 text-center text-sm">
          <Link href="/login" className="font-semibold text-blue-700 hover:underline">
            Voltar para o login
          </Link>
        </p>
      </div>
    </div>
  );
}
