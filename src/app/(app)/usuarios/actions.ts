"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { exigirUsuario } from "@/lib/dados";
import { createAdminClient } from "@/lib/supabase/admin";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function voltar(chave: "ok" | "erro", texto: string, extra = ""): never {
  redirect(`/usuarios?${chave}=${encodeURIComponent(texto)}${extra}`);
}

// Todas as pessoas com login administram o sistema por igual, então qualquer
// uma pode dar e tirar acesso. A única trava é não apagar a própria conta,
// para ninguém ficar trancado para fora sem querer.

export async function adicionarUsuario(formData: FormData) {
  await exigirUsuario();
  const nome = String(formData.get("nome") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const senha = String(formData.get("senha") ?? "");

  if (!nome) voltar("erro", "Informe o nome da pessoa.");
  if (!EMAIL_RE.test(email)) voltar("erro", "Informe um e-mail válido.");
  if (senha.length < 6) voltar("erro", "A senha provisória precisa ter pelo menos 6 caracteres.");

  const admin = createAdminClient();
  const { error } = await admin.auth.admin.createUser({
    email,
    password: senha,
    email_confirm: true,
    user_metadata: { nome },
  });
  if (error) {
    voltar(
      "erro",
      error.code === "email_exists"
        ? `Já existe um acesso para ${email}.`
        : `Não foi possível cadastrar: ${error.message}`,
    );
  }

  revalidatePath("/usuarios");
  voltar("ok", `Acesso criado para ${nome}.`, `&novo=${encodeURIComponent(email)}`);
}

export async function redefinirSenha(formData: FormData) {
  await exigirUsuario();
  const id = String(formData.get("id") ?? "");
  const email = String(formData.get("email") ?? "");
  const senha = String(formData.get("senha") ?? "");

  if (!id) voltar("erro", "Usuário não encontrado.");
  if (senha.length < 6) voltar("erro", "A senha provisória precisa ter pelo menos 6 caracteres.");

  const admin = createAdminClient();
  const { error } = await admin.auth.admin.updateUserById(id, { password: senha });
  if (error) voltar("erro", `Não foi possível trocar a senha: ${error.message}`);

  voltar("ok", `Senha provisória de ${email} trocada.`, `&novo=${encodeURIComponent(email)}`);
}

export async function removerUsuario(formData: FormData) {
  const { user } = await exigirUsuario();
  const id = String(formData.get("id") ?? "");
  const email = String(formData.get("email") ?? "");

  if (!id) voltar("erro", "Usuário não encontrado.");
  if (id === user.id) voltar("erro", "Você não pode remover o seu próprio acesso.");

  const admin = createAdminClient();
  const { error } = await admin.auth.admin.deleteUser(id);
  if (error) voltar("erro", `Não foi possível remover: ${error.message}`);

  revalidatePath("/usuarios");
  voltar("ok", `Acesso de ${email} removido. Os lançamentos feitos por essa pessoa continuam no sistema.`);
}
