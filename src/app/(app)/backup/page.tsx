import { ArchiveRestore, CloudDownload, ShieldCheck } from "lucide-react";
import { BotaoConfirmar } from "@/components/botao-confirmar";
import { CabecalhoPagina, Mensagem, Painel, botaoPrincipal, campo } from "@/components/ui";
import { exigirUsuario } from "@/lib/dados";
import { restaurarBackup } from "./actions";

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
  const [imoveis, pagamentos, despesas] = await Promise.all([contar("imoveis"), contar("pagamentos"), contar("despesas")]);

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

      <Painel titulo="Como manter o backup em dia (sem custo)">
        <div className="flex items-start gap-4">
          <span className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-emerald-50 text-emerald-600">
            <ShieldCheck className="h-6 w-6" aria-hidden />
          </span>
          <ol className="list-decimal space-y-1.5 pl-5 text-sm text-slate-700">
            <li>
              Uma vez por semana (ou depois de lançar os pagamentos do mês), clique em <b>Baixar backup agora</b>.
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
