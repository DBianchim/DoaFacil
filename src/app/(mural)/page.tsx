import Link from "next/link";
import { EmptyState } from "@/components/items/EmptyState";
import { ItemCard, ItemGrid } from "@/components/items/ItemCard";
import { ButtonLink } from "@/components/ui";
import { CATEGORIES } from "@/lib/catalog";
import { categoryCounts, recentItems } from "@/lib/data/items";
import { formatNumber, getImpactStats } from "@/lib/data/stats";
import { plural } from "@/lib/format";

const STEPS = [
  {
    icon: "🔍",
    bg: "bg-primary-pale",
    title: "Explore os itens",
    text: "Navegue pelos itens disponíveis no condomínio. Use a busca e os filtros para encontrar o que precisa.",
  },
  {
    icon: "💬",
    bg: "bg-accent-pale",
    title: "Demonstre interesse",
    text: "Clique em “Tenho interesse” para ver como o vizinho prefere ser chamado: WhatsApp, telefone ou e-mail.",
  },
  {
    icon: "🤝",
    bg: "bg-primary-pale",
    title: "Combine e retire",
    text: "Converse direto com o doador, combine o melhor horário e retire o item. Sem cadastro, sem senha.",
  },
];

export default async function HomePage() {
  const [recent, counts, stats] = await Promise.all([recentItems(4), categoryCounts(), getImpactStats()]);

  return (
    <main>
      {/* HERO */}
      <section className="bg-[linear-gradient(150deg,#D8F3DC_0%,#F0F7F2_45%,#F7F8F5_80%)]">
        <div className="mx-auto max-w-[1440px] px-4 pt-8 pb-10 sm:px-8 md:pt-16 md:pb-14 lg:px-20 lg:pt-[72px] lg:pb-[60px]">
          <div className="max-w-[660px]">
            {stats && (
              <p className="mb-5 inline-flex items-center gap-2 rounded-full border border-border bg-surface px-3.5 py-1.5 text-caption font-semibold text-primary md:mb-6">
                <span aria-hidden="true" className="size-2 rounded-full bg-primary-light" />
                {plural(stats.available, "item disponível agora", "itens disponíveis agora")}
              </p>
            )}
            <h1 className="mb-4 text-[32px] leading-[1.12] font-extrabold tracking-tight sm:text-h2 md:text-[42px] lg:text-h1">
              Aquilo que não usamos pode ser útil para um <em className="text-primary not-italic">vizinho</em>
            </h1>
            <p className="mb-7 text-body text-text-2 md:mb-9 md:text-[17px] md:leading-relaxed">
              Doe, encontre e reutilize objetos com os moradores do seu condomínio. Simples, gratuito e sustentável.
            </p>
            <form action="/explorar" method="get" role="search" className="flex max-w-[580px] gap-2.5 sm:gap-3">
              <label htmlFor="busca-home" className="sr-only">
                O que você está procurando?
              </label>
              <div className="flex h-13 flex-1 items-center gap-3 rounded-xl border-[1.5px] border-border bg-surface px-4 focus-within:border-primary">
                <SearchIcon />
                <input
                  id="busca-home"
                  name="q"
                  type="search"
                  placeholder="O que você está procurando?"
                  maxLength={80}
                  className="h-full w-full min-w-0 bg-transparent text-[15px] text-text outline-none placeholder:text-text-2/70 focus-visible:outline-none"
                />
              </div>
              <button
                type="submit"
                className="h-13 shrink-0 rounded-xl bg-primary px-5 text-[15px] font-semibold text-white transition-colors hover:bg-primary-hover sm:px-7"
              >
                Buscar
              </button>
            </form>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-[1440px] px-4 sm:px-8 lg:px-20">
        {/* CATEGORIAS */}
        <section aria-labelledby="titulo-categorias" className="pt-8 md:pt-9">
          <h2 id="titulo-categorias" className="mb-3 text-sm font-bold md:sr-only">
            Categorias
          </h2>
          <ul className="-mx-4 flex gap-2.5 overflow-x-auto px-4 pb-1 sm:mx-0 sm:flex-wrap sm:overflow-visible sm:px-0">
            <li aria-hidden="true" className="hidden items-center pr-1 text-caption font-semibold text-text-2 md:flex">
              Categorias:
            </li>
            {CATEGORIES.map((c) => (
              <li key={c.value} className="shrink-0">
                <Link
                  href={`/explorar?cat=${c.value}`}
                  className="flex min-h-11 items-center gap-2 rounded-full border-[1.5px] border-border bg-surface px-4 text-caption font-semibold text-text-2 transition-colors hover:border-primary-light hover:bg-primary-pale hover:text-primary"
                >
                  <span aria-hidden="true">{c.icon}</span>
                  {c.label}
                  <span className="rounded-full bg-bg px-2 py-0.5 text-[11px] text-text-2">
                    {counts[c.value]}
                    <span className="sr-only"> {counts[c.value] === 1 ? "disponível" : "disponíveis"}</span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </section>

        {/* RECENTES */}
        <section aria-labelledby="titulo-recentes" className="pt-10 md:pt-13">
          <div className="mb-5 flex items-end justify-between gap-4 md:mb-7">
            <div>
              <h2 id="titulo-recentes" className="text-lg font-bold md:text-h3">
                Doações recentes
              </h2>
              <p className="mt-1 text-caption text-text-2">As publicações mais novas do mural</p>
            </div>
            {recent.length > 0 && (
              <Link
                href="/explorar"
                className="flex min-h-11 shrink-0 items-center gap-1 rounded-lg px-1 text-sm font-semibold text-primary hover:text-primary-hover"
              >
                Ver todos
                <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                  <path d="M5 4L9.5 8L5 12" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </Link>
            )}
          </div>
          {recent.length > 0 ? (
            <ItemGrid>
              {recent.map((item, i) => (
                <li key={item.id}>
                  <ItemCard item={item} priority={i < 2} />
                </li>
              ))}
            </ItemGrid>
          ) : (
            <EmptyState
              title="Ainda não existem itens disponíveis"
              action={<ButtonLink href="/publicar">Publicar uma doação</ButtonLink>}
            >
              Seja o primeiro a publicar uma doação.
            </EmptyState>
          )}
        </section>

        {/* COMO FUNCIONA */}
        <section aria-labelledby="titulo-como" className="pt-14 md:pt-[72px]">
          <div className="mb-8 text-center md:mb-11">
            <span className="mb-3.5 inline-block rounded-full bg-primary-pale px-3.5 py-1.5 text-badge font-bold text-primary uppercase">
              Como funciona?
            </span>
            <h2 id="titulo-como" className="mb-2.5 text-[26px] leading-tight font-extrabold tracking-tight md:text-h2">
              Em poucos passos
            </h2>
            <p className="text-body text-text-2">Simples para quem doa e para quem busca</p>
          </div>
          <ol className="grid gap-4 md:grid-cols-3 md:gap-5">
            {STEPS.map((s, i) => (
              <li key={s.title} className="flex gap-4 rounded-[20px] border border-border bg-surface p-5 md:flex-col md:gap-[18px] md:px-6 md:py-7">
                <span aria-hidden="true" className={`flex size-12 shrink-0 items-center justify-center rounded-[14px] text-[22px] ${s.bg}`}>
                  {s.icon}
                </span>
                <div>
                  <p className="mb-1.5 text-badge font-bold tracking-wider text-text-2 uppercase">Passo 0{i + 1}</p>
                  <h3 className="mb-2 text-[17px] font-bold">{s.title}</h3>
                  <p className="text-caption leading-relaxed text-text-2">{s.text}</p>
                </div>
              </li>
            ))}
          </ol>
        </section>

        {/* IMPACTO */}
        {stats && (
          <section aria-labelledby="titulo-impacto" className="pt-12 md:pt-16">
            <h2 id="titulo-impacto" className="sr-only">
              Nosso impacto
            </h2>
            <dl className="grid gap-8 rounded-panel bg-primary px-6 py-10 sm:grid-cols-3 sm:gap-4 md:px-12 md:py-[52px] lg:px-20">
              {[
                { value: stats.donated, label: "Itens doados", sub: "desde o início do projeto" },
                { value: stats.available, label: "Disponíveis agora", sub: "esperando um novo dono" },
                { value: stats.contacts, label: "Contatos feitos", sub: "entre vizinhos do condomínio" },
              ].map((s) => (
                <div key={s.label} className="flex flex-col-reverse items-center gap-1.5 text-center">
                  <dt className="flex flex-col gap-1">
                    <span className="text-[15px] font-semibold text-primary-pale">{s.label}</span>
                    <span className="text-caption text-primary-pale">{s.sub}</span>
                  </dt>
                  <dd className="text-[42px] leading-none font-extrabold tracking-tight text-white md:text-[50px]">
                    {formatNumber(s.value)}
                  </dd>
                </div>
              ))}
            </dl>
          </section>
        )}
      </div>
    </main>
  );
}

function SearchIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 20 20" fill="none" aria-hidden="true" className="shrink-0 text-text-2">
      <circle cx="9" cy="9" r="5.5" stroke="currentColor" strokeWidth="1.5" />
      <path d="M15.5 15.5L13 13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}
