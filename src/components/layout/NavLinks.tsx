"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/cn";

const LINKS = [
  { href: "/", label: "Início", icon: HomeIcon },
  { href: "/explorar", label: "Explorar", icon: SearchIcon },
  { href: "/minhas", label: "Minhas doações", icon: ListIcon },
] as const;

function useIsActive() {
  const pathname = usePathname();
  return (href: string) => (href === "/" ? pathname === "/" : pathname.startsWith(href));
}

/** Navegação do cabeçalho (tablet e desktop). */
export function DesktopNav() {
  const isActive = useIsActive();
  return (
    <nav aria-label="Principal" className="hidden flex-1 gap-1 md:flex">
      {LINKS.map(({ href, label }) => (
        <Link
          key={href}
          href={href}
          aria-current={isActive(href) ? "page" : undefined}
          className={cn(
            "flex min-h-11 items-center rounded-lg px-4 text-sm font-medium text-text-2 transition-colors hover:bg-bg hover:text-text",
            "aria-[current=page]:bg-primary-pale aria-[current=page]:font-semibold aria-[current=page]:text-primary",
          )}
        >
          {label}
        </Link>
      ))}
    </nav>
  );
}

/** Barra inferior com o botão de publicar (celular). */
export function MobileNav() {
  const isActive = useIsActive();
  return (
    <nav
      aria-label="Principal"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-surface pb-[env(safe-area-inset-bottom)] md:hidden"
    >
      <div className="mx-auto flex max-w-md items-center justify-around px-2 pt-1.5 pb-2">
        {LINKS.map(({ href, label, icon: Icon }) => {
          const active = isActive(href);
          return (
            <Link
              key={href}
              href={href}
              aria-current={active ? "page" : undefined}
              className={cn(
                "flex min-h-12 min-w-16 flex-col items-center justify-center gap-1 rounded-xl px-2 text-[11px] font-semibold",
                active ? "text-primary" : "text-text-2",
              )}
            >
              <Icon active={active} />
              {label}
            </Link>
          );
        })}
        <Link
          href="/publicar"
          aria-label="Publicar doação"
          className="-mt-3 flex size-13 items-center justify-center rounded-2xl bg-primary text-white shadow-fab transition-colors hover:bg-primary-hover"
        >
          <svg width="22" height="22" viewBox="0 0 16 16" fill="none" aria-hidden="true">
            <path d="M8 2V14M2 8H14" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
          </svg>
        </Link>
      </div>
    </nav>
  );
}

type IconProps = { active: boolean };

function HomeIcon({ active }: IconProps) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill={active ? "currentColor" : "none"} aria-hidden="true">
      <path
        d="M4 10.5L12 4l8 6.5V19a1 1 0 0 1-1 1h-4.5v-5.5h-5V20H5a1 1 0 0 1-1-1v-8.5Z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
        fillOpacity={active ? 0.15 : 0}
      />
    </svg>
  );
}

function SearchIcon({ active }: IconProps) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="11" cy="11" r="6.5" stroke="currentColor" strokeWidth={active ? 2.3 : 1.8} />
      <path d="M20 20l-4.2-4.2" stroke="currentColor" strokeWidth={active ? 2.3 : 1.8} strokeLinecap="round" />
    </svg>
  );
}

function ListIcon({ active }: IconProps) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <rect
        x="4"
        y="3.5"
        width="16"
        height="17"
        rx="2.5"
        stroke="currentColor"
        strokeWidth="1.8"
        fill="currentColor"
        fillOpacity={active ? 0.15 : 0}
      />
      <path d="M8 9h8M8 13h8M8 17h5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}
