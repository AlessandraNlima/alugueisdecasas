import { ArchiveRestore, CircleCheck, CloudDownload, Mail, ShieldCheck, TriangleAlert } from "lucide-react";
import { SubmitButton } from "@/components/submit-button";
import { destinatariosBackup, emailConfigurado } from "@/lib/backup-servidor";
import { BotaoConfirmar } from "@/components/botao-confirmar";
import { CabecalhoPagina, Mensagem, Painel, botaoPrincipal, botaoSecundario, campo } from "@/components/ui";
import { exigirUsuario } from "@/lib/dados";
import { enviarBackupAgora, restaurarBackup } from "./actions";

function param(v: string | string[] | undefined) {
  return typeof v === "string" ? v : undefined;
}

export default async function BackupPage({ searchParams }: PageProps<"/backup">) {
  const sp = await searchParams;
  const { supabase } = await exigirUsuario();

  const contar = async (tabela: "imoveis" | "pagamentos" | "despesas") => {
    const { count } = await supabase.from(tabela).select("*", { count: "exact", head: true });
    return count ?? 0;
  };
  const [imoveis, pagamentos, despesas, para] = await Promise.all([
    contar("imoveis"),
    contar("pagamentos"),
    contar("despesas"),
    destinatariosBackup(),
  ]);
  const temEmail = emailConfigurado();
  const temAgenda = Boolean(process.env.CRON_SECRET);

  return (
    <>
      <CabecalhoPagina
        secao="Backup"
        titulo="Backup"
        subtitulo="Guarde uma cópia de todos os dados com vocês e restaure quando precisar."
      />
      <Mensagem ok={param(sp.ok)} erro={param(sp.erro)} />

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <Painel titulo="Baixar backup" subtitulo="Tudo o que está no sistema hoje, em um arquivo só.">
          <div className="flex items-start gap-4">
            <span className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-blue-50 text-blue-600">
              <CloudDownload className="h-6 w-6" aria-hidden />
            </span>
            <ul className="text-sm text-slate-700">
              <li>
                <b className="tabular-nums">{imoveis}</b> imóveis, com os dados dos inquilinos
              </li>
              <li>
                <b className="tabular-nums">{pagamentos}</b> pagamentos de aluguel
              </li>
              <li>
                <b className="tabular-nums">{despesas}</b> despesas
              </li>
            </ul>
          </div>
          {/* Link comum (não <Link>): é um download, não uma página. */}
          <a href="/backup/arquivo" className={`${botaoPrincipal} self-start`}>
            <CloudDownload className="h-4 w-4" aria-hidden />
            Baixar backup agora
          </a>
          <p className="text-xs text-slate-500">
            O arquivo (<code>backup-alugueis-AAAA-MM-DD.json</code>) vai para a pasta Downloads. Ele tem CPF e telefone
            dos inquilinos: guarde em lugar seguro.
          </p>
        </Painel>

        <Painel titulo="Restaurar backup" subtitulo="Recoloca no sistema os dados de um arquivo baixado aqui.">
          <form action={restaurarBackup} className="flex flex-col gap-4">
            <label className="flex flex-col gap-1.5 text-sm font-medium text-slate-700">
              Arquivo de backup (.json)
              <input
                name="arquivo"
                type="file"
                accept=".json,application/json"
                required
                className={`${campo} file:mr-3 file:rounded-md file:border-0 file:bg-blue-50 file:px-3 file:py-1 file:text-sm file:font-semibold file:text-blue-700`}
              />
            </label>
            <ul className="list-disc space-y-1 pl-5 text-sm text-slate-600">
              <li>Recoloca o que foi apagado e volta ao valor do backup o que foi alterado.</li>
              <li>Não apaga nada: lançamentos feitos depois do backup continuam no sistema.</li>
              <li>Logins e senhas não fazem parte do backup.</li>
            </ul>
            <BotaoConfirmar confirmar="Clique de novo para restaurar" className={`${botaoPrincipal} self-start`}>
              <ArchiveRestore className="h-4 w-4" aria-hidden />
              Restaurar backup
            </BotaoConfirmar>
          </form>
        </Painel>
      </div>

      <Painel
        titulo="Backup automático por e-mail"
        subtitulo="Toda segunda-feira de manhã o sistema manda o arquivo de backup por e-mail, sozinho."
        acao={
          temEmail && temAgenda ? (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">
              <CircleCheck className="h-3.5 w-3.5" aria-hidden /> Ligado
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-700">
              <TriangleAlert className="h-3.5 w-3.5" aria-hidden /> Falta configurar
            </span>
          )
        }
      >
        <div className="flex items-start gap-4">
          <span className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-blue-50 text-blue-600">
            <Mail className="h-6 w-6" aria-hidden />
          </span>
          <div className="flex min-w-0 flex-col gap-1 text-sm text-slate-700">
            <p>
              <b>Quem recebe:</b> {para.length ? para.join(", ") : "ninguém ainda"}
            </p>
            <p>
              <b>Quando:</b> toda segunda-feira, por volta das 8h (horário de Brasília).
            </p>
            {!temEmail && (
              <p className="text-amber-700">
                Para ligar, cadastre na Vercel as variáveis <code>GMAIL_USER</code> e <code>GMAIL_APP_PASSWORD</code> (senha
                de app do Gmail).
              </p>
            )}
            {temEmail && !temAgenda && (
              <p className="text-amber-700">
                O e-mail já funciona pelo botão abaixo. Para o envio semanal automático, cadastre na Vercel a variável{" "}
                <code>CRON_SECRET</code>.
              </p>
            )}
          </div>
        </div>
        {temEmail && (
          <form action={enviarBackupAgora}>
            <SubmitButton pendingText="Enviando..." className={botaoSecundario}>
              <Mail className="h-4 w-4 text-blue-600" aria-hidden />
              Enviar backup por e-mail agora
            </SubmitButton>
          </form>
        )}
      </Painel>

      <Painel titulo="Como manter o backup em dia (sem custo)">
        <div className="flex items-start gap-4">
          <span className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-emerald-50 text-emerald-600">
            <ShieldCheck className="h-6 w-6" aria-hidden />
          </span>
          <ol className="list-decimal space-y-1.5 pl-5 text-sm text-slate-700">
            <li>
              Toda segunda o backup chega por e-mail. Se o envio automático não estiver ligado, clique em{" "}
              <b>Baixar backup agora</b> uma vez por semana.
            </li>
            <li>
              Guarde o arquivo numa pasta do Google Drive compartilhada entre os sócios. Assim a cópia não depende do
              computador de ninguém.
            </li>
            <li>Mantenha os últimos arquivos; os mais antigos podem ser apagados.</li>
          </ol>
        </div>
        <p className="text-xs text-slate-500">
          O backup é gerado na hora e vai direto para o seu computador: nada fica guardado na Vercel ou no Supabase, então
          não ocupa espaço nem sai do plano gratuito.
        </p>
      </Painel>
    </>
  );
}
