"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { emailConfigurado, enviarEmail } from "@/lib/email";
import { chaveSecretaConfigurada, createAdminClient } from "@/lib/supabase/admin";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Gera um link de redefinição pelo Supabase e manda pelo nosso Gmail (o envio
// gratuito do próprio Supabase só entrega para membros da equipe do painel).
// A resposta é sempre a mesma, exista ou não o e-mail, para a tela não servir
// para descobrir quem tem acesso ao sistema.
export async function pedirLinkDeSenha(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  if (!EMAIL_RE.test(email)) {
    redirect(`/esqueci-senha?erro=${encodeURIComponent("Informe um e-mail válido.")}`);
  }
  if (!emailConfigurado() || !chaveSecretaConfigurada()) {
    redirect("/esqueci-senha?indisponivel=1");
  }

  const h = await headers();
  const site = `${h.get("x-forwarded-proto") ?? "https"}://${h.get("host")}`;

  try {
    const { data, error } = await createAdminClient().auth.admin.generateLink({ type: "recovery", email });
    const token = data?.properties?.hashed_token;
    if (!error && token) {
      const link = `${site}/auth/confirm?token_hash=${encodeURIComponent(token)}&type=recovery`;
      await enviarEmail({
        to: email,
        subject: "Redefinir sua senha – Sistema de Aluguéis",
        text: [
          "Recebemos um pedido para redefinir a sua senha do sistema de aluguéis.",
          "",
          "Abra este link para criar uma senha nova (vale por 1 hora e só pode ser usado uma vez):",
          link,
          "",
          "Se não foi você, ignore este e-mail: sua senha continua a mesma.",
        ].join("\n"),
      });
    }
  } catch (e) {
    console.error("Esqueci minha senha: falha ao enviar o link:", e);
    redirect(`/esqueci-senha?erro=${encodeURIComponent("Não foi possível enviar o e-mail agora. Tente de novo em alguns minutos.")}`);
  }

  redirect("/esqueci-senha?enviado=1");
}
