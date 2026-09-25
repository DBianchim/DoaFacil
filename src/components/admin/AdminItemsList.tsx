"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { ignorarDenuncias, removerAnuncio, type AdminResult } from "@/app/(mural)/admin/actions";
import { Badge, Button, ConfirmDialog, StatusBadge, useToast } from "@/components/ui";
import type { Status } from "@/lib/catalog";

export type AdminItem = {
  id: string;
  title: string;
  status: Status;
  nickname: string;
  block: string | null;
  reports: number;
  publishedLabel: string;
};

export function AdminItemsList({ items, emptyText }: { items: AdminItem[]; emptyText: string }) {
  const toast = useToast();
  const [pending, startTransition] = useTransition();
  const [busyId, setBusyId] = useState<string | null>(null);
  const [confirm, setConfirm] = useState<AdminItem | null>(null);

  function run(id: string, action: () => Promise<AdminResult>, after?: () => void) {
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

  if (items.length === 0) {
    return <p className="rounded-card border border-dashed border-disabled bg-surface px-5 py-8 text-center text-sm text-text-2">{emptyText}</p>;
  }

  return (
    <>
      <ul className="flex flex-col gap-3">
        {items.map((item) => {
          const busy = pending && busyId === item.id;
          return (
            <li
              key={item.id}
              aria-busy={busy || undefined}
              className="flex flex-col gap-3 rounded-card border border-border bg-surface p-4 md:flex-row md:items-center md:gap-5 md:px-5"
            >
              <div className="flex min-w-0 flex-1 flex-col gap-1.5">
                <div className="flex flex-wrap items-center gap-2">
                  <Link href={`/item/${item.id}`} className="-my-2.5 py-2.5 font-bold hover:text-primary hover:underline">
                    {item.title}
                  </Link>
                  <StatusBadge status={item.status} shape="tag" />
                  {item.reports > 0 && (
                    <Badge shape="tag" className="bg-danger-pale text-danger">
                      {item.reports === 1 ? "1 denúncia" : `${item.reports} denúncias`}
                    </Badge>
                  )}
                </div>
                <p className="text-xs text-text-2">
                  Por {item.nickname}
                  {item.block ? ` · Bloco ${item.block}` : ""} · publicado {item.publishedLabel}
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                {item.reports > 0 && (
                  <Button variant="neutral" size="sm" disabled={busy} onClick={() => run(item.id, () => ignorarDenuncias(item.id))}>
                    Arquivar denúncias
                  </Button>
                )}
                <Button variant="danger-soft" size="sm" disabled={busy} onClick={() => setConfirm(item)}>
                  Remover anúncio
                </Button>
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
          run(item.id, () => removerAnuncio(item.id), () => setConfirm(null));
        }}
        title="Remover este anúncio?"
        confirmLabel="Remover"
      >
        “{confirm?.title}” sai do mural e os contatos do doador são apagados. O doador não é avisado automaticamente. Isso
        não pode ser desfeito.
      </ConfirmDialog>
    </>
  );
}
