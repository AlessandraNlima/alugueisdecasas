import { BarraLateral } from "@/components/barra-lateral";
import { exigirUsuario } from "@/lib/dados";

export default async function AppLayout({ children }: LayoutProps<"/">) {
  const { user } = await exigirUsuario();
  const nome = typeof user.user_metadata?.nome === "string" ? user.user_metadata.nome : null;

  return (
    <div className="flex flex-1 flex-col lg:pl-64">
      <BarraLateral email={user.email ?? ""} nome={nome} />
      <main className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-6 sm:px-6 lg:px-10 lg:py-8">
        {children}
      </main>
    </div>
  );
}
