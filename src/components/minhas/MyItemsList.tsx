"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { mudarStatus, remover, renovar, type ActionResult } from "@/app/(mural)/minhas/actions";
import { Button, ConfirmDialog, StatusBadge, useToast } from "@/components/ui";
import { categoryIcon, placeholderBg, type Status } from "@/lib/catalog";
import { cn } from "@/lib/cn";
import type { MyItem } from "@/lib/data/items";

export function MyItemsList({ items }: { items: MyItem[] }) {
  const toast = useToast();
  const [pending, startTransition] = useTransition();
  const [busyId, setBusyId] = useState<string | null>(null);
  const [confirm, setConfirm] = useState<MyItem | null>(null);

  function run(id: string, action: () => Promise<ActionResult>, after?: () => void) {
    setBusyId(id);
    startTransition(async () => {
      try {
        const res = await action();
        if (res.ok) {
          toast(res.message);
          after?.();
        } else toast(res.error, "error");
      } catch {
        toast("Sem conexão com o servidor. Tente de novo.", "error");
      } finally {
        setBusyId(null);
      }
    });
  }

  const setStatus = (item: MyItem, status: Status) => run(item.id, () => mudarStatus(item.id, status));

  return (
    <>
      <ul className="flex flex-col gap-3.5">
        {items.map((item) => {
          const busy = pending && busyId === item.id;
          const donated = item.status === "doado";
          const soon = item.expiresSoon;
          return (
            <li
              key={item.id}
              aria-busy={busy || undefined}
              className={cn(
                "grid grid-cols-[64px_minmax(0,1fr)] gap-x-4 gap-y-3 rounded-card border border-border bg-surface p-4 md:grid-cols-[72px_minmax(0,1fr)_120px_120px_auto] md:items-center md:gap-5 md:px-5 lg:grid-cols-[72px_minmax(0,1fr)_120px_120px_340px]",
                donated && "opacity-75",
              )}
            >
              <span
                aria-hidden="true"
                className="flex size-16 items-center justify-center overflow-hidden rounded-xl text-3xl md:size-[72px]"
                style={{ backgroundColor: placeholderBg(item.category) }}
              >
                {item.photoUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={item.photoUrl} alt="" className="size-full object-cover" />
                ) : (
                  categoryIcon(item.category)
                )}
              </span>

              <div className="flex min-w-0 flex-col items-start gap-1.5">
                <Link href={`/item/${item.id}`} className="-my-2.5 line-clamp-2 py-2.5 font-bold hover:text-primary hover:underline">
                  {item.title}
                </Link>
                <StatusBadge status={item.status} shape="tag" dot />
              </div>

              <dl className="col-span-2 grid grid-cols-2 gap-3 md:contents">
                <div>
                  <dt className="text-xs text-text-2">Viram o contato</dt>
                  <dd className="text-lg font-extrabold">{item.interestClicks}</dd>
                </div>
                <div>
                  <dt className="text-xs text-text-2">Expira</dt>
                  <dd className={cn("text-sm font-bold", soon ? "text-accent-text" : "text-text")}>
                    {donated ? "—" : item.expiresLabel}
                    {soon && <span className="sr-only"> (expira em breve)</span>}
                  </dd>
                </div>
              </dl>

              <div className="col-span-2 flex flex-wrap gap-2 md:col-span-1 md:justify-end">
                {item.status === "disponivel" && (
                  <Button variant="accent-soft" size="sm" disabled={busy} onClick={() => setStatus(item, "reservado")}>
                    Reservar
                  </Button>
                )}
                {item.status === "reservado" && (
                  <Button variant="neutral" size="sm" disabled={busy} onClick={() => setStatus(item, "disponivel")}>
                    Liberar
                  </Button>
                )}
                {!donated && (
                  <Button size="sm" disabled={busy} onClick={() => setStatus(item, "doado")}>
                    Marcar como doado
                  </Button>
                )}
                {soon && (
                  <Button variant="secondary" size="sm" disabled={busy} onClick={() => run(item.id, () => renovar(item.id))}>
                    Renovar +30 dias
                  </Button>
                )}
                <button
                  type="button"
                  onClick={() => setConfirm(item)}
                  disabled={busy}
                  aria-label={`Remover ${item.title}`}
                  className="flex size-11 items-center justify-center rounded-[9px] border-[1.5px] border-border bg-surface text-danger hover:border-danger-border hover:bg-danger-pale disabled:opacity-60"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                    <path d="M4 7H20M9 7V4H15V7M6 7L7 20H17L18 7" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </button>
              </div>
            </li>
          );
        })}
      </ul>

      <ConfirmDialog
        open={confirm !== null}
        onCancel={() => setConfirm(null)}
        loading={pending && busyId === confirm?.id}
        onConfirm={() => {
          if (!confirm) return;
          const item = confirm;
          run(item.id, () => remover(item.id), () => setConfirm(null));
        }}
        title="Remover esta doação?"
        confirmLabel="Remover"
      >
        “{confirm?.title}” sai do mural e seus contatos deste anúncio são apagados. Isso não pode ser desfeito.
      </ConfirmDialog>
    </>
  );
}
