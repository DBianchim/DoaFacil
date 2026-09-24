import type { ComponentProps } from "react";
import { cn } from "@/lib/cn";

/** Bloco cinza pulsante. Decorativo: quem envolve deve anunciar o carregamento (aria-busy). */
export function Skeleton({ className, ...props }: ComponentProps<"div">) {
  return <div aria-hidden="true" className={cn("rounded-lg bg-muted motion-safe:animate-pulse", className)} {...props} />;
}

/** Esqueleto no formato do card de doação (foto + título + tags + rodapé). */
export function ItemCardSkeleton() {
  return (
    <div aria-hidden="true" className="flex flex-col overflow-hidden rounded-card border border-border bg-surface">
      <Skeleton className="h-44 rounded-none" />
      <div className="flex flex-col gap-3 p-4">
        <Skeleton className="h-4 w-3/4" />
        <div className="flex gap-1.5">
          <Skeleton className="h-5 w-16 rounded-full" />
          <Skeleton className="h-5 w-20 rounded-full" />
        </div>
        <div className="flex justify-between pt-1">
          <Skeleton className="h-3 w-16" />
          <Skeleton className="h-3 w-12" />
        </div>
      </div>
    </div>
  );
}

export function ItemGridSkeleton({ count = 8 }: { count?: number }) {
  return (
    <div role="status" aria-busy="true" className="grid grid-cols-1 gap-5 min-[480px]:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      <span className="sr-only">Carregando doações…</span>
      {Array.from({ length: count }, (_, i) => (
        <ItemCardSkeleton key={i} />
      ))}
    </div>
  );
}
