import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { DonorLinkCard } from "@/components/publish/DonorLinkCard";
import { ButtonLink } from "@/components/ui";
import { requireCondoAccess } from "@/lib/condo";
import { currentDonor, donorLink, siteOrigin } from "@/lib/donor";
import { isUuid } from "@/lib/rate-limit";
import { supabaseAdmin } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Doação publicada" };

const CHANNEL_NAMES = { whatsapp: "WhatsApp", email: "e-mail", phone: "telefone", instagram: "Instagram" } as const;

function joinPt(list: string[]) {
  return list.length <= 1 ? (list[0] ?? "") : `${list.slice(0, -1).join(", ")} ou ${list.at(-1)}`;
}

export default async function PublicadoPage({ searchParams }: PageProps<"/publicado">) {
  await requireCondoAccess();
  const donor = await currentDonor();
  if (!donor) redirect("/publicar");

  // Só mostra o título se o item for deste doador.
  const itemId = (await searchParams).item;
  let summary: { title: string; channels: string[] } | null = null;
  if (isUuid(itemId)) {
    const db = supabaseAdmin();
    const { data: item } = await db.from("items").select("title").eq("id", itemId).eq("donor_id", donor.id).maybeSingle();
    if (item) {
      const { data: c } = await db.from("item_contacts").select("whatsapp, phone, email, instagram").eq("item_id", itemId).maybeSingle();
      const channels = (Object.keys(CHANNEL_NAMES) as (keyof typeof CHANNEL_NAMES)[])
        .filter((k) => c?.[k])
        .map((k) => CHANNEL_NAMES[k]);
      summary = { title: item.title, channels };
    }
  }

  const link = donorLink(await siteOrigin(), donor.key);

  return (
    <main className="mx-auto flex w-full max-w-[640px] flex-1 flex-col items-center px-4 py-10 text-center md:py-14">
      <span aria-hidden="true" className="mb-5 flex size-16 items-center justify-center rounded-full bg-primary-pale">
        <svg width="30" height="30" viewBox="0 0 24 24" fill="none">
          <path d="M5 12.5l5 5L19 7" stroke="#2D6A4F" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </span>
      <h1 className="mb-3 text-[26px] leading-tight font-extrabold tracking-tight md:text-[32px]">Doação publicada com sucesso!</h1>
      <p className="mb-8 max-w-md text-body text-text-2">
        {summary ? (
          <>
            Agora outros moradores já podem ver sua <strong className="text-text">{summary.title}</strong>
            {summary.channels.length > 0 && <> e chamar você pelo {joinPt(summary.channels)}</>}.
          </>
        ) : (
          "Agora outros moradores já podem ver sua doação no mural."
        )}
      </p>

      <section className="w-full rounded-panel border border-border bg-surface p-5 text-left sm:p-7">
        <div className="mb-5 flex gap-3.5">
          <span aria-hidden="true" className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-accent-pale">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
              <circle cx="8" cy="15" r="4" stroke="#B85D1C" strokeWidth="1.8" />
              <path d="M11 12L20 3M17 6L20 9M15 8L17 10" stroke="#B85D1C" strokeWidth="1.8" strokeLinecap="round" />
            </svg>
          </span>
          <div>
            <h2 className="text-lg font-bold">Guarde seu link de doador</h2>
            <p className="mt-1 text-sm leading-relaxed text-text-2">
              É por ele que você marca itens como reservados ou doados, renova e remove. Vale para{" "}
              <strong className="text-text">todas</strong> as suas doações — um link só. Não compartilhe com ninguém.
            </p>
          </div>
        </div>
        <DonorLinkCard link={link} />
      </section>

      <p className="mt-5 text-caption text-text-2">
        Este navegador já lembra de você: as próximas doações entram automaticamente no mesmo link.
      </p>

      <div className="mt-6 flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
        <ButtonLink href="/minhas" size="lg">
          Ver minhas doações
        </ButtonLink>
        <ButtonLink href="/publicar" size="lg" variant="secondary">
          Doar outro item
        </ButtonLink>
      </div>
    </main>
  );
}
