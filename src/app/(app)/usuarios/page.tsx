import Link from "next/link";
import { randomInt } from "node:crypto";
import { headers } from "next/headers";
import { BotaoConfirmar } from "@/components/botao-confirmar";
import { CabecalhoPagina, Mensagem, Painel, Vazio, botaoPerigo, tabelaCaixa, td, th, thead } from "@/components/ui";
import { UserMinus } from "lucide-react";
import { dataBR } from "@/lib/alugueis";
import { exigirUsuario } from "@/lib/dados";
import { chaveSecretaConfigurada, createAdminClient } from "@/lib/supabase/admin";
import { removerUsuario, adicionarUsuario, redefinirSenha } from "./actions";
import { FormNovoUsuario, FormRedefinirSenha, MensagemDeAcesso } from "./formularios";

function param(v: string | string[] | undefined) {
  return typeof v === "string" ? v : undefined;
}

// Fácil de ditar por telefone: sem letras que se confundem (l/I/O/0).
function gerarSenha(): string {
  const letras = "abcdefghjkmnpqrstuvwxyz";
  const parte = () => Array.from({ length: 4 }, () => letras[randomInt(letras.length)]).join("");
  return `${parte()}-${randomInt(1000, 9999)}`;
}

export default async function UsuariosPage({ searchParams }: PageProps<"/usuarios">) {
  const sp = await searchParams;
  const { user } = await exigirUsuario();

  if (!chaveSecretaConfigurada()) {
    return (
      <>
        <CabecalhoPagina
          secao="Usuários"
          titulo="Usuários"
          subtitulo="Quem pode entrar no sistema e administrar os aluguéis."
        />
        <Painel titulo="Falta uma configuração">
          <p className="text-sm text-slate-700">
            Para cadastrar e remover pessoas por aqui, o sistema precisa da chave secreta do
            Supabase. Peça para quem configurou o sistema cadastrar na Vercel a variável{" "}
            <code className="rounded bg-slate-100 px-1.5 py-0.5">SUPABASE_SECRET_KEY</code> (Supabase →
            Project Settings → API Keys → Secret key) e publicar de novo.
          </p>
        </Painel>
      </>
    );
  }

  const admin = createAdminClient();
  const { data, error } = await admin.auth.admin.listUsers({ perPage: 200 });
  const usuarios = (data?.users ?? []).sort((a, b) => (a.email ?? "").localeCompare(b.email ?? ""));

  const h = await headers();
  const site = `${h.get("x-forwarded-proto") ?? "https"}://${h.get("host")}`;
  const novo = param(sp.novo);

  return (
    <>
      <CabecalhoPagina
        secao="Usuários"
        titulo="Usuários"
        subtitulo="Quem pode entrar no sistema e administrar os aluguéis."
      />
      <Mensagem ok={param(sp.ok)} erro={param(sp.erro) ?? (error ? `Erro ao listar: ${error.message}` : undefined)} />
      {novo && <MensagemDeAcesso key={novo} email={novo} site={site} />}

      <Painel titulo="Dar acesso a uma pessoa">
        <p className="text-sm text-slate-600">
          A pessoa entra com o e-mail e a senha provisória abaixo e depois troca a senha em{" "}
          <b>Minha senha</b>. Todo mundo com acesso pode lançar, editar e excluir dados e
          administrar usuários.
        </p>
        <FormNovoUsuario action={adicionarUsuario} senhaSugerida={gerarSenha()} />
      </Painel>

      <Painel titulo={`Quem tem acesso (${usuarios.length})`}>
        {usuarios.length === 0 ? (
          <Vazio>Nenhum usuário.</Vazio>
        ) : (
          <div className={tabelaCaixa}>
            <table className="w-full text-sm">
              <thead className={thead}>
                <tr>
                  <th className={th}>Pessoa</th>
                  <th className={th}>Desde</th>
                  <th className={th}>Último acesso</th>
                  <th className={th}>
                    <span className="sr-only">Ações</span>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {usuarios.map((u) => {
                  const eu = u.id === user.id;
                  const nome = typeof u.user_metadata?.nome === "string" ? u.user_metadata.nome : null;
                  return (
                    <tr key={u.id}>
                      <td className={td}>
                        <p className="font-semibold text-slate-900">
                          {nome ?? u.email}
                          {eu && <span className="ml-2 rounded-full bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-700">você</span>}
                        </p>
                        {nome && <p className="text-xs text-slate-500">{u.email}</p>}
                      </td>
                      <td className={`${td} whitespace-nowrap tabular-nums`}>{dataBR(u.created_at)}</td>
                      <td className={`${td} whitespace-nowrap tabular-nums`}>
                        {u.last_sign_in_at ? dataBR(u.last_sign_in_at) : <span className="text-slate-400">nunca entrou</span>}
                      </td>
                      <td className={`${td} whitespace-nowrap text-right align-top`}>
                        {eu && (
                          <Link href="/minha-senha" className="text-xs font-medium text-blue-700 hover:underline">
                            {nome ? "Editar meu nome" : "Adicionar meu nome"}
                          </Link>
                        )}
                        {!eu && (
                          <div className="flex flex-wrap items-start justify-end gap-1">
                            <FormRedefinirSenha
                              action={redefinirSenha}
                              id={u.id}
                              email={u.email ?? ""}
                              senhaSugerida={gerarSenha()}
                            />
                            <form action={removerUsuario}>
                              <input type="hidden" name="id" value={u.id} />
                              <input type="hidden" name="email" value={u.email ?? ""} />
                              <BotaoConfirmar
                                confirmar="Remover acesso?"
                                className={botaoPerigo}
                              >
                                <UserMinus className="h-3.5 w-3.5" aria-hidden />
                                Remover
                              </BotaoConfirmar>
                            </form>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Painel>
    </>
  );
}
