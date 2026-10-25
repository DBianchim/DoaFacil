import type { Metadata } from "next";
import { Badge, ButtonLink } from "@/components/ui";
import { requireCondoAccess } from "@/lib/condo";
import { AGENDA, CURADORIA_EM, NOTICIAS } from "@/lib/noticias";

export const metadata: Metadata = {
  title: "Notícias",
  description: "Notícias, datas e números sobre doação, reúso e consumo consciente.",
};

const dataLonga = new Intl.DateTimeFormat("pt-BR", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" });

const BENEFICIOS = [
  { icon: "🌍", title: "Menos resíduo", text: "O item continua sendo usado e não vira lixo." },
  { icon: "💸", title: "Economia para quem recebe", text: "Um vizinho deixa de comprar algo novo." },
  { icon: "🤝", title: "Vizinhança mais próxima", text: "Doar cria conversa e confiança entre moradores." },
  { icon: "🏠", title: "Espaço livre em casa", text: "Desapegar abre espaço para o que importa." },
];

function ExternalIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path d="M6 3H13V10M13 3L4 12" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export default async function NoticiasPage() {
  await requireCondoAccess();

  return (
    <main className="flex-1">
      {/* HERO */}
      <section className="bg-[linear-gradient(150deg,#D8F3DC_0%,#F0F7F2_45%,#F7F8F5_80%)]">
        <div className="mx-auto max-w-[1100px] px-4 pt-10 pb-12 sm:px-8 md:pt-16 md:pb-14">
          <span className="mb-4 inline-block rounded-full bg-surface px-3.5 py-1.5 text-badge font-bold tracking-wider text-primary uppercase">
            Notícias e conscientização
          </span>
          <h1 className="mb-4 max-w-3xl text-[32px] leading-[1.12] font-extrabold tracking-tight md:text-[42px]">
            O que está acontecendo sobre doação, reúso e lixo no Brasil
          </h1>
          <p className="max-w-2xl text-body text-text-2 md:text-[17px] md:leading-relaxed">
            Notícias de fontes confiáveis, datas para mobilizar o condomínio e o que cada uma tem a ver com o nosso mural.
          </p>
        </div>
      </section>

      <div className="mx-auto flex max-w-[1100px] flex-col gap-14 px-4 pt-12 sm:px-8 md:pt-14">
        {/* EM NÚMEROS */}
        <section aria-labelledby="titulo-numeros" className="rounded-panel bg-primary px-5 py-8 text-white md:px-10 md:py-10">
          <h2 id="titulo-numeros" className="mb-6 text-[22px] leading-tight font-extrabold tracking-tight md:text-[28px]">
            O lixo no Brasil, em números
          </h2>
          <dl className="grid gap-6 sm:grid-cols-3">
            {[
              { valor: "81,6 mi t", label: "de resíduos urbanos gerados em 2024" },
              { valor: "384 kg", label: "por habitante, em um ano" },
              { valor: "8,7%", label: "foi para a reciclagem" },
            ].map((n) => (
              <div key={n.valor} className="flex flex-col-reverse gap-1">
                <dt className="text-sm text-primary-pale">{n.label}</dt>
                <dd className="text-[38px] leading-none font-extrabold tracking-tight md:text-[44px]">{n.valor}</dd>
              </div>
            ))}
          </dl>
          <p className="mt-6 max-w-3xl text-sm leading-relaxed text-primary-pale">
            Reciclar é importante, mas é só uma parte da solução. <strong className="text-white">Reutilizar vem antes</strong>: o
            objeto continua servindo sem gastar energia para ser transformado.
          </p>
          <p className="mt-3 text-xs text-primary-pale">
            Fonte: Panorama dos Resíduos Sólidos no Brasil 2025 (Abrema), via Agência Brasil.
          </p>
        </section>

        {/* AGENDA */}
        <section aria-labelledby="titulo-agenda">
          <h2 id="titulo-agenda" className="mb-2 text-[24px] leading-tight font-extrabold tracking-tight md:text-[28px]">
            Datas para mobilizar o condomínio
          </h2>
          <p className="mb-6 text-body text-text-2">Boas ocasiões para lembrar os vizinhos de publicar o que está parado.</p>
          <ul className="grid gap-4 md:grid-cols-3">
            {AGENDA.map((a) => (
              <li key={a.titulo} className="flex flex-col gap-2 rounded-[20px] border border-border bg-surface p-5">
                <p className="text-caption font-bold text-accent-text">{a.quando}</p>
                <h3 className="text-[17px] font-bold">{a.titulo}</h3>
                <p className="text-sm leading-relaxed text-text-2">{a.texto}</p>
                {a.url && (
                  <a
                    href={a.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-auto inline-flex min-h-11 items-center gap-1.5 self-start text-sm font-semibold text-primary hover:text-primary-hover hover:underline"
                  >
                    {a.fonte ?? "Saiba mais"}
                    <ExternalIcon />
                    <span className="sr-only">(abre em outra aba)</span>
                  </a>
                )}
              </li>
            ))}
          </ul>
        </section>

        {/* NOTÍCIAS */}
        <section aria-labelledby="titulo-noticias">
          <h2 id="titulo-noticias" className="mb-2 text-[24px] leading-tight font-extrabold tracking-tight md:text-[28px]">
            Notícias
          </h2>
          <p className="mb-6 text-body text-text-2">Resumos feitos pela equipe do Doa Fácil. Leia a matéria completa na fonte.</p>
          <ul className="flex flex-col gap-4">
            {NOTICIAS.map((n) => (
              <li key={n.url}>
                <article className="flex flex-col gap-3 rounded-[20px] border border-border bg-surface p-5 md:p-6">
                  <div className="flex flex-wrap items-center gap-2 text-caption text-text-2">
                    <Badge shape="tag" tone="condition">
                      {n.tema}
                    </Badge>
                    <span>{n.fonte}</span>
                    <span aria-hidden="true">·</span>
                    {n.data ? <time dateTime={n.data}>{dataLonga.format(new Date(`${n.data}T00:00:00Z`))}</time> : <span>Referência</span>}
                  </div>
                  <h3 className="text-lg leading-snug font-bold">{n.titulo}</h3>
                  <p className="text-sm leading-relaxed text-text-2">{n.resumo}</p>
                  <p className="flex gap-2 rounded-xl bg-primary-mist px-3.5 py-2.5 text-sm text-primary">
                    <span aria-hidden="true">🌱</span>
                    <span>
                      <strong className="font-semibold">E o mural com isso? </strong>
                      {n.ligacao}
                    </span>
                  </p>
                  <a
                    href={n.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex min-h-11 items-center gap-1.5 self-start text-sm font-semibold text-primary hover:text-primary-hover hover:underline"
                  >
                    Ler na fonte
                    <ExternalIcon />
                    <span className="sr-only">: {n.titulo} (abre em outra aba)</span>
                  </a>
                </article>
              </li>
            ))}
          </ul>
          <p className="mt-4 text-xs text-text-2">
            Seleção de conteúdos conferida em {CURADORIA_EM}. Os links levam a sites externos, que podem mudar ou sair do ar.
          </p>
        </section>

        {/* BENEFÍCIOS */}
        <section aria-labelledby="titulo-beneficios" className="rounded-panel border border-border bg-surface p-5 md:p-8">
          <h2 id="titulo-beneficios" className="mb-6 text-[24px] leading-tight font-extrabold tracking-tight md:text-[28px]">
            Os benefícios de doar
          </h2>
          <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {BENEFICIOS.map((b) => (
              <li key={b.title} className="flex flex-col gap-2">
                <span aria-hidden="true" className="flex size-11 items-center justify-center rounded-xl bg-primary-pale text-xl">
                  {b.icon}
                </span>
                <h3 className="font-bold">{b.title}</h3>
                <p className="text-sm text-text-2">{b.text}</p>
              </li>
            ))}
          </ul>
          <div className="mt-7 flex flex-col gap-3 sm:flex-row">
            <ButtonLink href="/por-que-doar" variant="secondary">
              Entenda por que doar faz diferença
            </ButtonLink>
            <ButtonLink href="/publicar">Publicar doação</ButtonLink>
          </div>
        </section>
      </div>
    </main>
  );
}
