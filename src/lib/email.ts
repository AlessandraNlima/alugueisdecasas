import "server-only";
import nodemailer from "nodemailer";
import type Mail from "nodemailer/lib/mailer";

// Envio pelo Gmail (gratuito) com senha de app. Usado pelo backup automático
// e pelo "Esqueci minha senha". Sem GMAIL_USER e GMAIL_APP_PASSWORD na Vercel
// o envio fica desligado.
export function emailConfigurado(): boolean {
  return Boolean(process.env.GMAIL_USER && process.env.GMAIL_APP_PASSWORD);
}

export async function enviarEmail(mensagem: Omit<Mail.Options, "from">) {
  const usuario = process.env.GMAIL_USER;
  const senha = process.env.GMAIL_APP_PASSWORD;
  if (!usuario || !senha) {
    throw new Error("Envio de e-mail não configurado (faltam GMAIL_USER e GMAIL_APP_PASSWORD na Vercel).");
  }
  const transporte = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 465,
    secure: true,
    auth: { user: usuario, pass: senha.replace(/\s+/g, "") },
  });
  await transporte.sendMail({ from: `Sistema de Aluguéis <${usuario}>`, ...mensagem });
}
