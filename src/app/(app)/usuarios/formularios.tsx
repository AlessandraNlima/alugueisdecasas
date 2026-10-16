"use client";

import { useEffect, useState } from "react";
import { CopiarTexto } from "@/components/copiar-texto";
import { SubmitButton } from "@/components/submit-button";
import { botaoPrincipal, campo, rotulo } from "@/components/ui";

// A senha provisória não volta do servidor (não vai na URL nem fica no
// banco em texto). O formulário guarda na sessionStorage da própria aba só
// até a página recarregar, para montar a mensagem pronta para enviar.
const CHAVE = "alugueis:ultimo-acesso";

function lembrar(email: string, senha: string) {
  try {
    sessionStorage.setItem(CHAVE, JSON.stringify({ email: email.trim().toLowerCase(), senha }));
  } catch {
    // Sem sessionStorage a mensagem só sai sem a senha.
  }
}

export function FormNovoUsuario({
  action,
  senhaSugerida,
}: {
  action: (formData: FormData) => Promise<void>;
  senhaSugerida: string;
}) {
  return (
    <form
      action={action}
      onSubmit={(e) => {
        const f = new FormData(e.currentTarget);
        lembrar(String(f.get("email") ?? ""), String(f.get("senha") ?? ""));
      }}
      className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4"
    >
      <label className={rotulo}>
        Nome
        <input name="nome" required placeholder="Ex.: Maria Souza" className={campo} />
      </label>
      <label className={rotulo}>
        E-mail
        <input name="email" type="email" required placeholder="maria@email.com" className={campo} />
      </label>
      <label className={rotulo}>
        Senha provisória
        <input
          name="senha"
          required
          minLength={6}
          defaultValue={senhaSugerida}
          autoComplete="off"
          className={`${campo} font-mono`}
        />
      </label>
      <div className="flex items-end">
        <SubmitButton className={`${botaoPrincipal} w-full`}>Dar acesso</SubmitButton>
      </div>
    </form>
  );
}

export function FormRedefinirSenha({
  action,
  id,
  email,
  senhaSugerida,
}: {
  action: (formData: FormData) => Promise<void>;
  id: string;
  email: string;
  senhaSugerida: string;
}) {
  return (
    <details className="inline-block text-left">
      <summary className="cursor-pointer list-none rounded px-2 py-1 text-xs font-medium text-emerald-700 hover:bg-emerald-50">
        Nova senha
      </summary>
      <form
        action={action}
        onSubmit={() => lembrar(email, (document.getElementById(`senha-${id}`) as HTMLInputElement).value)}
        className="mt-2 flex flex-wrap items-end gap-2"
      >
        <input type="hidden" name="id" value={id} />
        <input type="hidden" name="email" value={email} />
        <input
          id={`senha-${id}`}
          name="senha"
          required
          minLength={6}
          defaultValue={senhaSugerida}
          autoComplete="off"
          aria-label="Senha provisória"
          className={`${campo} w-40 font-mono`}
        />
        <SubmitButton className={`${botaoPrincipal} py-2`}>Salvar</SubmitButton>
      </form>
    </details>
  );
}

export function MensagemDeAcesso({ email, site }: { email: string; site: string }) {
  const [senha, setSenha] = useState<string | null>(null);

  useEffect(() => {
    try {
      const salvo = JSON.parse(sessionStorage.getItem(CHAVE) ?? "null");
      sessionStorage.removeItem(CHAVE);
      // eslint-disable-next-line react-hooks/set-state-in-effect -- sessionStorage só existe no navegador
      if (salvo?.email === email.toLowerCase()) setSenha(salvo.senha);
    } catch {
      // Sem sessionStorage: mensagem sem a senha.
    }
  }, [email]);

  const texto = [
    "Olá! Você tem acesso ao sistema de aluguéis.",
    "",
    `Endereço: ${site}`,
    `E-mail: ${email}`,
    `Senha provisória: ${senha ?? "(a que eu te passar)"}`,
    "",
    "No primeiro acesso, clique no seu e-mail no topo da tela (Minha senha) e crie a sua própria senha.",
  ].join("\n");

  return (
    <div className="flex flex-col gap-2 rounded-xl border border-emerald-200 bg-emerald-50/50 p-4">
      <p className="text-sm font-semibold text-slate-900">Mensagem pronta para enviar à pessoa</p>
      <CopiarTexto texto={texto} />
    </div>
  );
}
