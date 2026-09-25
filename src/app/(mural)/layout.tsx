import { MobileNav } from "@/components/layout/NavLinks";
import { SiteFooter, SiteHeader } from "@/components/layout/SiteChrome";
import { requireCondoAccess } from "@/lib/condo";
import { env } from "@/lib/env";

/** Moldura das páginas do mural: cabeçalho, rodapé e barra inferior no celular. */
export default async function MuralLayout({ children }: LayoutProps<"/">) {
  await requireCondoAccess();
  const condoName = env.condoName;

  return (
    <>
      <a
        href="#conteudo"
        className="sr-only z-50 rounded-lg bg-primary px-4 py-3 font-semibold text-white focus:not-sr-only focus:fixed focus:top-2 focus:left-2"
      >
        Pular para o conteúdo
      </a>
      {/* No selo do celular o prefixo "Condomínio" sai para o nome caber ao lado do logo. */}
      <SiteHeader condoName={condoName.replace(/^Condom[íi]nio\s+/i, "")} />
      <div id="conteudo" className="flex flex-1 flex-col">
        {children}
      </div>
      <SiteFooter condoName={condoName} />
      <MobileNav />
    </>
  );
}
