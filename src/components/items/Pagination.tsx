import Link from "next/link";
import { cn } from "@/lib/cn";
import { exploreHref, type ExploreParams } from "./explore-url";

/** Páginas visíveis: primeira, última e vizinhas da atual, com "…" nos saltos. */
function pageList(current: number, total: number): (number | "gap")[] {
  const pages = new Set([1, total, current - 1, current, current + 1]);
  const sorted = [...pages].filter((p) => p >= 1 && p <= total).sort((a, b) => a - b);
  const out: (number | "gap")[] = [];
  sorted.forEach((p, i) => {
    if (i > 0 && p - sorted[i - 1] > 1) out.push("gap");
    out.push(p);
  });
  return out;
}

const box =
  "flex size-11 items-center justify-center rounded-lg border-[1.5px] text-caption font-semibold transition-colors";

export function Pagination({ params, page, pageCount }: { params: ExploreParams; page: number; pageCount: number }) {
  if (pageCount <= 1) return null;
  const prev = page > 1 ? exploreHref(params, { page: page - 1 }) : null;
  const next = page < pageCount ? exploreHref(params, { page: page + 1 }) : null;

  return (
    <nav aria-label="Paginação" className="mt-10 flex justify-center">
      <ul className="flex items-center gap-1.5 sm:gap-2">
        <li>
          {prev ? (
            <Link href={prev} aria-label="Página anterior" className={cn(box, "border-border bg-surface text-text-2 hover:border-primary-light")}>
              ‹
            </Link>
          ) : (
            <span aria-hidden="true" className={cn(box, "border-border bg-surface text-disabled")}>
              ‹
            </span>
          )}
        </li>
        {pageList(page, pageCount).map((p, i) =>
          p === "gap" ? (
            <li key={`gap-${i}`} aria-hidden="true" className="px-1 text-text-2">
              …
            </li>
          ) : (
            <li key={p}>
              <Link
                href={exploreHref(params, { page: p })}
                aria-label={`Página ${p}`}
                aria-current={p === page ? "page" : undefined}
                className={cn(
                  box,
                  p === page
                    ? "border-primary bg-primary text-white"
                    : "border-border bg-surface text-text-2 hover:border-primary-light",
                )}
              >
                {p}
              </Link>
            </li>
          ),
        )}
        <li>
          {next ? (
            <Link href={next} aria-label="Próxima página" className={cn(box, "border-border bg-surface text-text-2 hover:border-primary-light")}>
              ›
            </Link>
          ) : (
            <span aria-hidden="true" className={cn(box, "border-border bg-surface text-disabled")}>
              ›
            </span>
          )}
        </li>
      </ul>
    </nav>
  );
}
