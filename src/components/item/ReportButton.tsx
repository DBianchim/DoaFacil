"use client";

import { useState } from "react";
import { ConfirmDialog, useToast } from "@/components/ui";

/** "Denunciar anúncio" com confirmação; o síndico vê as denúncias em /admin. */
export function ReportButton({ itemId }: { itemId: string }) {
  const toast = useToast();
  const [open, setOpen] = useState(false);
  const [sending, setSending] = useState(false);

  async function report() {
    setSending(true);
    try {
      const res = await fetch(`/api/denunciar/${itemId}`, { method: "POST" });
      const body = await res.json().catch(() => null);
      if (!res.ok) {
        toast(body?.error ?? "Não foi possível enviar a denúncia agora.", "error");
        return;
      }
      toast(body?.repeated ? "Você já denunciou este anúncio. O síndico vai analisar." : "Denúncia enviada. Obrigado por avisar — o síndico vai analisar.");
      setOpen(false);
    } catch {
      toast("Sem conexão. Confira sua internet e tente de novo.", "error");
    } finally {
      setSending(false);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex min-h-11 items-center gap-1.5 rounded-lg px-1 text-xs font-semibold text-danger hover:underline"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path d="M5 21V4M5 4h11l-2 4 2 4H5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        Denunciar anúncio
      </button>
      <ConfirmDialog
        open={open}
        onCancel={() => setOpen(false)}
        onConfirm={() => void report()}
        loading={sending}
        title="Denunciar este anúncio?"
        confirmLabel="Denunciar"
      >
        Use para anúncios com venda, conteúdo impróprio ou dados de outra pessoa. O síndico recebe a denúncia sem saber
        quem enviou.
      </ConfirmDialog>
    </>
  );
}
