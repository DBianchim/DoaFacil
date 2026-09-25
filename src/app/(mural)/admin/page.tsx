import type { Metadata } from "next";
import { AdminItemsList, type AdminItem } from "@/components/admin/AdminItemsList";
import { AdminLogin } from "@/components/admin/AdminLogin";
import { ButtonLink } from "@/components/ui";
import { isAdmin } from "@/lib/admin";
import { requireCondoAccess } from "@/lib/condo";
import { env } from "@/lib/env";
import { relativeDate } from "@/lib/format";
import { supabaseAdmin } from "@/lib/supabase/server";
import { sairAdmin } from "./actions";

export const metadata: Metadata = { title: "Painel do síndico" };

async function loadItems(): Promise<AdminItem[]> {
  const { data, error } = await supabaseAdmin()
    .from("items")
    .select("id, title, status, nickname, block, reports, created_at")
    .gt("expires_at", new Date().toISOString())
    .order("reports", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(300);
  if (error) throw new Error(`Falha ao carregar anúncios: ${error.message}`);
  return data.map((r) => ({
    id: r.id,
    title: r.title,
    status: r.status,
    nickname: r.nickname,
    block: r.block,
    reports: r.reports,
    publishedLabel: relativeDate(r.created_at).toLowerCase(),
  }));
}

export default async function AdminPage() {
  await requireCondoAccess();

  if (!(await isAdmin())) {
    return (
      <main className="mx-auto flex w-full max-w-md flex-1 flex-col gap-6 px-4 py-14">
        <div>
          <h1 className="text-[26px] font-extrabold tracking-tight">Painel do síndico</h1>
          <p className="mt-1.5 text-sm text-text-2">
            Área para revisar denúncias, remover anúncios e imprimir o cartaz do condomínio.
          </p>
        </div>
        <section className="rounded-panel border border-border bg-surface p-6">
          <AdminLogin />
        </section>
      </main>
    );
  }

  const items = await loadItems();
  const reported = items.filter((i) => i.reports > 0);

  return (
    <main className="mx-auto flex w-full max-w-[1100px] flex-1 flex-col gap-10 px-4 py-8 sm:px-8 md:py-10">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-[26px] font-extrabold tracking-tight md:text-[28px]">Painel do síndico</h1>
          <p className="mt-1 text-sm text-text-2">
            {items.length} anúncios no mural · {reported.length === 1 ? "1 com denúncia" : `${reported.length} com denúncias`}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <ButtonLink href="/cartaz" variant="secondary">
            Imprimir cartaz com QR Code
          </ButtonLink>
          <form action={sairAdmin}>
            <button type="submit" className="min-h-11 rounded-control px-4 text-sm font-semibold text-text-2 hover:bg-bg hover:text-text">
              Sair
            </button>
          </form>
        </div>
      </div>

      <section aria-labelledby="titulo-denuncias" className="flex flex-col gap-4">
        <h2 id="titulo-denuncias" className="text-h3">
          Denúncias
        </h2>
        <AdminItemsList items={reported} emptyText="Nenhuma denúncia no momento. 🎉" />
      </section>

      <section aria-labelledby="titulo-todos" className="flex flex-col gap-4">
        <h2 id="titulo-todos" className="text-h3">
          Todos os anúncios
        </h2>
        <AdminItemsList items={items.filter((i) => i.reports === 0)} emptyText="Nenhum outro anúncio no mural." />
      </section>

      <section aria-labelledby="titulo-acesso" className="rounded-panel border border-border bg-surface p-5 md:p-7">
        <h2 id="titulo-acesso" className="text-lg font-bold">
          Código de acesso do condomínio
        </h2>
        <p className="mt-2 text-sm text-text-2">
          Código atual: <strong className="font-mono text-base tracking-widest text-primary">{env.condoCode}</strong>
        </p>
        <p className="mt-3 text-sm leading-relaxed text-text-2">
          Se o cartaz foi fotografado ou o código vazou para fora do condomínio, troque-o na Vercel (
          <code>CONDO_CODE</code> e <code>CONDO_CODE_VERSION</code>), faça um novo deploy e imprima o cartaz de novo.
          Todos os moradores precisarão ler o QR Code outra vez.
        </p>
      </section>
    </main>
  );
}
