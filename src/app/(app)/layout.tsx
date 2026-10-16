import Link from "next/link";
import { signOut } from "@/app/login/actions";
import { exigirUsuario } from "@/lib/dados";

const LINKS = [
  { href: "/", label: "Mês" },
  { href: "/imoveis", label: "Imóveis" },
  { href: "/despesas", label: "Despesas" },
  { href: "/relatorio", label: "Relatório" },
];

export default async function AppLayout({ children }: LayoutProps<"/">) {
  const { user } = await exigirUsuario();

  return (
    <div className="flex flex-1 flex-col">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-3">
          <Link href="/" className="text-lg font-bold text-emerald-800">
            Aluguéis
          </Link>
          <nav className="flex flex-wrap gap-1 text-sm">
            {LINKS.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className="rounded-md px-3 py-1.5 font-medium text-slate-600 hover:bg-emerald-50 hover:text-emerald-800"
              >
                {l.label}
              </Link>
            ))}
          </nav>
          <form action={signOut} className="flex items-center gap-3 text-sm text-slate-500">
            <span className="hidden sm:inline">{user.email}</span>
            <button type="submit" className="rounded-md px-2 py-1 hover:bg-slate-100 hover:text-slate-900">
              Sair
            </button>
          </form>
        </div>
      </header>
      <main className="mx-auto flex w-full max-w-6xl flex-col gap-5 px-4 py-6">{children}</main>
    </div>
  );
}
