import Link from "next/link";
import { Badge, StatusBadge } from "@/components/ui";
import { categoryIcon, categoryLabel, conditionLabel, placeholderBg } from "@/lib/catalog";
import { cn } from "@/lib/cn";
import type { ItemCardData } from "@/lib/data/items";
import { relativeDate } from "@/lib/format";

type Props = {
  item: ItemCardData;
  /** Mostra o trecho da descrição (usado no Explorar). */
  showDescription?: boolean;
  /** Carrega a foto sem lazy (cards visíveis logo de cara). */
  priority?: boolean;
};

/**
 * Card de doação. No celular é uma linha (foto à esquerda); a partir de 480px
 * vira o card vertical dos protótipos. O card inteiro é um único link.
 */
export function ItemCard({ item, showDescription, priority }: Props) {
  const donated = item.status === "doado";
  return (
    <Link
      href={`/item/${item.id}`}
      className={cn(
        "group flex overflow-hidden rounded-card border border-border bg-surface transition-shadow hover:shadow-[0_6px_20px_rgb(26_43_26/0.08)]",
        "min-[480px]:flex-col",
      )}
    >
      <div
        className="relative flex w-[104px] shrink-0 items-center justify-center min-[480px]:h-44 min-[480px]:w-full"
        style={{ backgroundColor: placeholderBg(item.category) }}
      >
        {item.photoUrl ? (
          // Foto via URL assinada do Supabase (muda a cada hora): <img> simples, sem otimização da Vercel.
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={item.photoUrl}
            alt=""
            loading={priority ? "eager" : "lazy"}
            decoding="async"
            className="absolute inset-0 size-full object-cover"
          />
        ) : (
          <span aria-hidden="true" className="text-4xl min-[480px]:text-[52px]">
            {categoryIcon(item.category)}
          </span>
        )}
        <StatusBadge status={item.status} className="absolute top-2.5 left-2.5 hidden min-[480px]:inline-flex" />
        {donated && (
          <div className="absolute inset-0 flex items-center justify-center bg-bg/85 px-3 text-center">
            <span className="text-caption font-bold text-text-2 max-[479px]:hidden">Item doado com sucesso ✓</span>
          </div>
        )}
      </div>

      <div className="flex min-w-0 flex-1 flex-col gap-2 p-3.5 min-[480px]:px-4 min-[480px]:pt-3.5 min-[480px]:pb-4">
        <div className="flex items-start justify-between gap-2">
          <h3 className="line-clamp-2 text-[15px] leading-snug font-bold text-text group-hover:text-primary">
            {item.title}
          </h3>
          <StatusBadge status={item.status} className="shrink-0 px-2 text-[10px] min-[480px]:hidden" />
        </div>
        {showDescription && item.description && (
          <p className="line-clamp-2 text-caption text-text-2 max-[479px]:hidden">{item.description}</p>
        )}
        <div className="flex flex-wrap gap-1.5">
          <Badge shape="tag">{categoryLabel(item.category)}</Badge>
          <Badge shape="tag" tone="condition">
            {conditionLabel(item.condition)}
          </Badge>
        </div>
        <div className="mt-auto flex items-center justify-between gap-2 pt-1 text-xs min-[480px]:border-t min-[480px]:border-divider min-[480px]:pt-2.5">
          <time dateTime={item.createdAt} className="text-text-2">
            {relativeDate(item.createdAt)}
          </time>
          {item.block && <span className="font-semibold text-primary">Bloco {item.block}</span>}
        </div>
      </div>
    </Link>
  );
}

export function ItemGrid({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <ul
      className={cn(
        "grid grid-cols-1 gap-3 min-[480px]:grid-cols-2 min-[480px]:gap-5 lg:grid-cols-3 xl:grid-cols-4",
        className,
      )}
    >
      {children}
    </ul>
  );
}
