"use server";

import { revalidatePath } from "next/cache";
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

// Nome que aparece no menu e na lista de Usuários. Fica nos metadados da
// própria conta, que cada pessoa pode alterar sem precisar da chave secreta.
export async function salvarNome(formData: FormData) {
  const { supabase } = await exigirUsuario();
  const nome = String(formData.get("nome") ?? "").trim().replace(/\s+/g, " ");

  if (!nome) redirect(`/minha-senha?erro=${encodeURIComponent("Informe o seu nome.")}`);
  if (nome.length > 80) redirect(`/minha-senha?erro=${encodeURIComponent("Use no máximo 80 caracteres.")}`);

  const { error } = await supabase.auth.updateUser({ data: { nome } });
  if (error) redirect(`/minha-senha?erro=${encodeURIComponent(`Não foi possível salvar: ${error.message}`)}`);

  revalidatePath("/", "layout");
  redirect(`/minha-senha?ok=${encodeURIComponent("Nome salvo.")}`);
}
