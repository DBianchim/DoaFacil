import type { Metadata } from "next";
import Link from "next/link";
import { EmptyState } from "@/components/items/EmptyState";
import { ExploreFilters } from "@/components/items/ExploreFilters";
import { exploreHref, type ExploreParams } from "@/components/items/explore-url";
import { ItemCard, ItemGrid } from "@/components/items/ItemCard";
import { Pagination } from "@/components/items/Pagination";
import { ButtonLink } from "@/components/ui";
import { CATEGORIES, categoryLabel, isCategory, isCondition, isStatus } from "@/lib/catalog";
import { cn } from "@/lib/cn";
import { listItems, SORT_OPTIONS, type SortOption } from "@/lib/data/items";
import { plural } from "@/lib/format";

export const metadata: Metadata = { title: "Explorar" };

const one = (v: string | string[] | undefined) => (typeof v === "string" && v.trim() ? v.trim() : undefined);

export default async function ExplorarPage({ searchParams }: PageProps<"/explorar">) {
  const sp = await searchParams;

  // Valores inválidos na URL são ignorados em vez de quebrar a página.
  const q = one(sp.q)?.slice(0, 80);
  const cat = one(sp.cat);
  const cond = one(sp.cond);
  const status = one(sp.status);
  const sortRaw = one(sp.sort);
  const sort = SORT_OPTIONS.some((o) => o.value === sortRaw) ? (sortRaw as SortOption) : "recentes";
  const pageNum = Number.parseInt(one(sp.page) ?? "1", 10);
  const page = Number.isFinite(pageNum) && pageNum > 0 ? pageNum : 1;

  const filters = {
    q,
    category: isCategory(cat) ? cat : undefined,
    condition: isCondition(cond) ? cond : undefined,
    status: isStatus(status) ? status : undefined,
    sort,
    page,
  };
  const params: ExploreParams = {
    q,
    cat: filters.category,
    cond: filters.condition,
    status: filters.status,
    sort,
  };
  const hasFilters = Boolean(q || filters.category || filters.condition || filters.status);

  const { items, total, pageCount } = await listItems(filters);

  return (
    <main className="flex-1">
      <div className="border-b border-border bg-surface">
        <div className="mx-auto max-w-[1440px] px-4 py-4 sm:px-8 md:py-5 lg:px-14">
          <h1 className="sr-only">Explorar doações</h1>
          <ExploreFilters params={params} sortOptions={SORT_OPTIONS} />

          <nav aria-label="Categorias" className="mt-3.5">
            <ul className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:flex-wrap sm:px-0">
              {[{ value: undefined, label: "Todos" }, ...CATEGORIES].map((c) => {
                const active = filters.category === c.value;
                return (
                  <li key={c.label} className="shrink-0">
                    <Link
                      href={exploreHref(params, { cat: c.value, page: 1 })}
                      aria-current={active ? "true" : undefined}
                      className={cn(
                        "flex min-h-11 items-center rounded-full border-[1.5px] px-3.5 text-xs font-semibold transition-colors sm:min-h-9",
                        active
                          ? "border-primary-light bg-primary-pale text-primary"
                          : "border-border bg-surface text-text-2 hover:border-primary-light",
                      )}
                    >
                      {c.label}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>
        </div>
      </div>

      <div className="mx-auto w-full max-w-[1440px] px-4 pt-6 sm:px-8 md:pt-7 lg:px-14">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3 md:mb-6">
          <p role="status" className="text-sm text-text-2">
            <strong className="text-text">{plural(total, "item", "itens")}</strong>{" "}
            {total === 1 ? "encontrado" : "encontrados"}
            {q && (
              <>
                {" "}
                para “<span className="font-semibold text-text">{q}</span>”
              </>
            )}
            {filters.category && <> em {categoryLabel(filters.category)}</>}
          </p>
          {hasFilters && (
            <Link href="/explorar" className="flex min-h-11 items-center text-sm font-semibold text-primary hover:text-primary-hover">
              Limpar filtros
            </Link>
          )}
        </div>

        {items.length > 0 ? (
          <>
            <ItemGrid className="xl:grid-cols-3 2xl:grid-cols-4">
              {items.map((item, i) => (
                <li key={item.id}>
                  <ItemCard item={item} showDescription priority={i < 3} />
                </li>
              ))}
            </ItemGrid>
            <Pagination params={params} page={page} pageCount={pageCount} />
          </>
        ) : hasFilters || page > 1 ? (
          <EmptyState
            icon="🔎"
            title="Nenhum item encontrado"
            action={
              <ButtonLink href="/explorar" variant="secondary">
                Ver todas as doações
              </ButtonLink>
            }
          >
            {q ? (
              <>Não achamos nada para “{q}”. Tente outra palavra ou tire alguns filtros.</>
            ) : (
              <>Nenhuma doação combina com esses filtros agora. Tente tirar algum deles.</>
            )}
          </EmptyState>
        ) : (
          <EmptyState
            title="Ainda não existem itens disponíveis"
            action={<ButtonLink href="/publicar">Publicar uma doação</ButtonLink>}
          >
            Seja o primeiro a publicar uma doação.
          </EmptyState>
        )}
      </div>
    </main>
  );
}
