"use server";

import { redirect } from "next/navigation";
import { exigirUsuario } from "@/lib/dados";

export async function trocarSenha(formData: FormData) {
  const { supabase } = await exigirUsuario();
  const senha = String(formData.get("senha") ?? "");
  const confirmacao = String(formData.get("confirmacao") ?? "");

  const erro = (msg: string) => redirect(`/minha-senha?erro=${encodeURIComponent(msg)}`);

  if (senha.length < 6) erro("A senha precisa ter pelo menos 6 caracteres.");
  if (senha !== confirmacao) erro("As duas senhas não são iguais.");

  const { error } = await supabase.auth.updateUser({ password: senha });
  if (error) {
    erro(
      error.code === "same_password"
        ? "A nova senha precisa ser diferente da atual."
        : `Não foi possível trocar a senha: ${error.message}`,
    );
  }

  redirect(`/minha-senha?ok=${encodeURIComponent("Senha alterada. Use a nova senha no próximo login.")}`);
}
