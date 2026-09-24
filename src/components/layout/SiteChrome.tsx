import Link from "next/link";
import { ButtonLink, Logo } from "@/components/ui";
import { DesktopNav } from "./NavLinks";

export function SiteHeader({ condoName }: { condoName: string }) {
  return (
    <header className="sticky top-0 z-40 border-b border-border bg-surface">
      <div className="mx-auto flex h-14 max-w-[1440px] items-center gap-4 px-4 sm:px-8 md:h-[68px] md:gap-8 lg:px-14">
        <Link href="/" className="flex min-h-11 shrink-0 items-center rounded-lg">
          <Logo size="sm" className="md:hidden" />
          <Logo className="hidden md:inline-flex" />
        </Link>
        <DesktopNav />
        <span className="ml-auto truncate rounded-full bg-primary-pale px-2.5 py-1 text-[11px] font-bold text-primary md:hidden">
          {condoName}
        </span>
        <ButtonLink href="/publicar" className="hidden md:inline-flex">
          <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true">
            <path d="M8 2V14M2 8H14" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
          </svg>
          Publicar doação
        </ButtonLink>
      </div>
    </header>
  );
}

export function SiteFooter({ condoName }: { condoName: string }) {
  return (
    <footer className="mt-16 bg-text pb-[calc(88px+env(safe-area-inset-bottom))] md:pb-0">
      <div className="mx-auto flex max-w-[1440px] flex-col gap-4 px-4 py-9 sm:px-8 md:flex-row md:items-center md:justify-between lg:px-20">
        <div className="flex flex-col gap-1.5">
          <Logo size="sm" tone="onDark" />
          <p className="text-xs text-primary-light">Plataforma de doações do {condoName}</p>
        </div>
        <p className="text-xs text-primary-light">© {new Date().getFullYear()} Doa Fácil · Feito com cuidado pela comunidade</p>
      </div>
    </footer>
  );
}
