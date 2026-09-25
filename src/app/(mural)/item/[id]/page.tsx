import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { cache } from "react";
import { ContactModal } from "@/components/item/ContactModal";
import { PhotoGallery } from "@/components/item/PhotoGallery";
import { ReportButton } from "@/components/item/ReportButton";
import { Badge } from "@/components/ui";
import { categoryIcon, categoryLabel, conditionLabel, placeholderBg } from "@/lib/catalog";
import { cn } from "@/lib/cn";
import { getItem } from "@/lib/data/items";
import { expiresIn } from "@/lib/format";

const loadItem = cache(getItem);

export async function generateMetadata({ params }: PageProps<"/item/[id]">): Promise<Metadata> {
  const item = await loadItem((await params).id);
  return { title: item?.title ?? "Anúncio não encontrado" };
}

const fullDate = new Intl.DateTimeFormat("pt-BR", {
  timeZone: "America/Sao_Paulo",
  day: "numeric",
  month: "short",
  year: "numeric",
});

const STATUS_PILL = {
  disponivel: { label: "Item disponível", className: "bg-primary-pale text-primary" },
  reservado: { label: "Item reservado", className: "bg-accent-pale text-accent-ink" },
  doado: { label: "Item já doado", className: "bg-muted text-text-2" },
} as const;

const CHANNEL_NAMES = { whatsapp: "WhatsApp", email: "E-mail", phone: "Ligação", instagram: "Instagram" } as const;

export default async function ItemPage({ params }: PageProps<"/item/[id]">) {
  const item = await loadItem((await params).id);
  if (!item) notFound();

  const pill = STATUS_PILL[item.status];
  const donated = item.status === "doado";
  const channels = (Object.keys(CHANNEL_NAMES) as (keyof typeof CHANNEL_NAMES)[]).filter((k) => item.channels[k]);
  const place = item.block ? `Bloco ${item.block}` : "No condomínio";

  return (
    <main className="mx-auto w-full max-w-[1440px] flex-1 px-4 sm:px-8 lg:px-14">
      <nav aria-label="Você está em" className="pt-4 md:pt-5">
        <ol className="flex flex-wrap items-center gap-2 text-caption text-text-2">
          <li>
            <Link href="/" className="hover:text-primary hover:underline">
              Início
            </Link>
          </li>
          <li aria-hidden="true">›</li>
          <li>
            <Link href="/explorar" className="hover:text-primary hover:underline">
              Explorar
            </Link>
          </li>
          <li aria-hidden="true">›</li>
          <li aria-current="page" className="max-w-[60vw] truncate font-semibold text-text">
            {item.title}
          </li>
        </ol>
      </nav>

      <div className="grid gap-6 pt-5 md:pt-7 lg:grid-cols-[minmax(0,1fr)_420px] lg:items-start lg:gap-12">
        {/* ESQUERDA: fotos e descrição */}
        <div className="flex flex-col gap-5 md:gap-6">
          <PhotoGallery
            title={item.title}
            photos={item.photos}
            placeholder={{ icon: categoryIcon(item.category), bg: placeholderBg(item.category) }}
          />

          {(item.description || item.notes) && (
            <section className="rounded-[20px] border border-border bg-surface p-5 md:p-7">
              <h2 className="mb-3 text-lg font-bold md:mb-4">Descrição</h2>
              {item.description && (
                <p className="text-sm leading-[1.75] whitespace-pre-line text-text-2">{item.description}</p>
              )}
              {item.notes && (
                <p className={cn("text-sm leading-[1.75] whitespace-pre-line text-text-2", item.description && "mt-4")}>
                  <strong className="font-semibold text-text">Observações: </strong>
                  {item.notes}
                </p>
              )}
            </section>
          )}

          <section className="rounded-[20px] border border-[#B7DFC7] bg-primary-pale p-5 md:p-6">
            <div className="mb-3 flex items-center gap-3">
              <span aria-hidden="true" className="flex size-9 items-center justify-center rounded-control bg-primary">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                  <path d="M12 21s-7-5.5-7-11a7 7 0 0 1 14 0c0 5.5-7 11-7 11Z" stroke="#fff" strokeWidth="1.8" />
                  <circle cx="12" cy="10" r="2.5" stroke="#fff" strokeWidth="1.8" />
                </svg>
              </span>
              <h2 className="text-[15px] font-bold">Informações de retirada</h2>
            </div>
            <p className="text-caption leading-relaxed text-primary">
              A retirada é combinada diretamente com o doador pelo contato que ele escolheu.{" "}
              {item.block ? `O item está no Bloco ${item.block}.` : ""}
              {item.pickupInfo && <> Disponível para retirada: {item.pickupInfo}</>}
            </p>
          </section>
        </div>

        {/* DIREITA: informações e contato */}
        <aside className="flex flex-col gap-4 lg:sticky lg:top-[88px]">
          <p>
            <span
              className={cn("inline-flex items-center gap-2 rounded-full px-3.5 py-1.5 text-caption font-bold", pill.className)}
            >
              <span aria-hidden="true" className="size-2 rounded-full bg-current" />
              {pill.label}
            </span>
          </p>

          <div>
            <h1 className="mb-2.5 text-2xl leading-tight font-extrabold tracking-tight md:text-[28px]">{item.title}</h1>
            <div className="flex flex-wrap gap-2">
              <Badge shape="tag" className="px-3 py-1 text-[13px]">
                <span aria-hidden="true">{categoryIcon(item.category)}</span> {categoryLabel(item.category)}
              </Badge>
              <Badge shape="tag" tone="condition" className="px-3 py-1 text-[13px]">
                {conditionLabel(item.condition)}
              </Badge>
            </div>
          </div>

          <dl className="overflow-hidden rounded-card border border-border bg-surface">
            {[
              ["Categoria", categoryLabel(item.category)],
              ["Condição", conditionLabel(item.condition)],
              ["Publicado em", fullDate.format(new Date(item.createdAt))],
              ["Localização", place],
              ["Viram o contato", item.interestClicks === 1 ? "1 vizinho" : `${item.interestClicks} vizinhos`],
            ].map(([label, value]) => (
              <div key={label} className="flex items-center justify-between gap-4 border-b border-divider px-5 py-3.5 last:border-b-0">
                <dt className="text-caption font-medium text-text-2">{label}</dt>
                <dd className="text-right text-caption font-semibold">{value}</dd>
              </div>
            ))}
          </dl>

          <div className="flex items-center gap-3.5 rounded-card border border-border bg-surface p-5">
            <span
              aria-hidden="true"
              className="flex size-11 shrink-0 items-center justify-center rounded-full bg-primary-pale text-[15px] font-bold text-primary"
            >
              {item.nickname.slice(0, 1).toUpperCase()}
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-bold">Doado por {item.nickname}</p>
              <p className="mt-0.5 text-xs text-text-2">{item.block ? `Morador do Bloco ${item.block}` : "Morador do condomínio"}</p>
              {channels.length > 0 && (
                <ul aria-label="Formas de contato" className="mt-2 flex flex-wrap gap-1.5">
                  {channels.map((c) => (
                    <li key={c} className="rounded-full border border-border bg-bg px-2.5 py-0.5 text-[11px] font-semibold text-text-2">
                      {CHANNEL_NAMES[c]}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>

          <ContactModal
            itemId={item.id}
            title={item.title}
            nickname={item.nickname}
            block={item.block}
            disabled={donated}
            thumb={{
              url: item.photos[0]?.thumbUrl,
              icon: categoryIcon(item.category),
              bg: placeholderBg(item.category),
            }}
          />
          <p className="text-center text-xs leading-relaxed text-text-2">
            {donated ? (
              "Esta doação já foi concluída. Veja outros itens no mural."
            ) : item.status === "reservado" ? (
              <>
                Este item já tem alguém interessado.
                <br />
                Você ainda pode falar com o doador caso a retirada não aconteça.
              </>
            ) : (
              <>
                O contato do doador aparece após o clique.
                <br />
                Combine a retirada diretamente com ele.
              </>
            )}
          </p>

          <div className="flex items-center justify-between gap-3 border-t border-border pt-2">
            <span className="text-xs text-text-2">Expira {expiresIn(item.expiresAt)}</span>
            <ReportButton itemId={item.id} />
          </div>
        </aside>
      </div>
    </main>
  );
}
