import type { Metadata } from "next";
import { EmptyState } from "@/components/items/EmptyState";
import { DonorBanner } from "@/components/minhas/DonorBanner";
import { MyItemsList } from "@/components/minhas/MyItemsList";
import { ButtonLink } from "@/components/ui";
import { requireCondoAccess } from "@/lib/condo";
import { listDonorItems } from "@/lib/data/items";
import { currentDonor, currentDonorKey, donorLink, siteOrigin } from "@/lib/donor";

export const metadata: Metadata = { title: "Minhas doações" };

export default async function MinhasPage({ searchParams }: PageProps<"/minhas">) {
  await requireCondoAccess();
  const badLink = (await searchParams).link === "invalido";
  const [donor, key] = await Promise.all([currentDonor(), currentDonorKey()]);

  // Sem chave válida neste navegador (ou link errado/incompleto).
  if (!donor) {
    const hadKey = Boolean(key) || badLink;
    return (
      <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-12 sm:px-8">
        <h1 className="mb-6 text-[26px] font-extrabold tracking-tight md:text-[28px]">Minhas doações</h1>
        <EmptyState
          icon={hadKey ? "🔑" : "🌱"}
          title={hadKey ? "Não encontramos doações para este link" : "Você ainda não publicou por este aparelho"}
          action={<ButtonLink href="/publicar">Publicar uma doação</ButtonLink>}
        >
          {hadKey ? (
            <>Confira se você copiou o link de doador inteiro. Ele termina depois de <code>?k=</code> com 24 caracteres.</>
          ) : (
            <>
              Se você já publicou em outro celular ou computador, abra o seu <strong>link de doador</strong> aqui — ele
              traz todas as suas doações. Ele foi mostrado logo depois da primeira publicação.
            </>
          )}
        </EmptyState>
      </main>
    );
  }

  const items = await listDonorItems(donor.id);
  const count = (s: string) => items.filter((i) => i.status === s).length;
  const stats = [
    { label: "Disponíveis", value: count("disponivel"), color: "text-primary" },
    { label: "Reservados", value: count("reservado"), color: "text-accent-text" },
    { label: "Doados", value: count("doado"), color: "text-text-2" },
  ];

  return (
    <main className="mx-auto w-full max-w-[1440px] flex-1 px-4 pt-6 sm:px-8 md:pt-7 lg:px-14">
      <DonorBanner link={donorLink(await siteOrigin(), donor.key)} />

      <div className="flex flex-col gap-5 pt-7 md:flex-row md:items-end md:justify-between md:pt-8">
        <div>
          <h1 className="mb-1.5 text-[26px] font-extrabold tracking-tight md:text-[28px]">Minhas doações</h1>
          <p className="text-sm text-text-2">
            Atualize o status assim que combinar a retirada — isso evita contatos desnecessários.
          </p>
        </div>
        <dl className="grid grid-cols-3 gap-2.5 md:flex">
          {stats.map((s) => (
            <div key={s.label} className="flex flex-col-reverse rounded-xl border border-border bg-surface px-4 py-2.5 md:min-w-[110px]">
              <dt className="text-xs font-semibold text-text-2">{s.label}</dt>
              <dd className={`text-[22px] font-extrabold ${s.color}`}>{s.value}</dd>
            </div>
          ))}
        </dl>
      </div>

      <div className="pt-6">
        {items.length > 0 ? (
          <MyItemsList items={items} />
        ) : (
          <EmptyState
            title="Nenhuma doação ativa"
            action={<ButtonLink href="/publicar">Publicar uma doação</ButtonLink>}
          >
            Suas doações aparecem aqui por 30 dias depois de publicadas. Que tal doar algo que não usa mais?
          </EmptyState>
        )}
      </div>
    </main>
  );
}
