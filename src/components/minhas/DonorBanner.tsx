"use client";

import { Button, useToast } from "@/components/ui";

/** Faixa "você está acessando pelo seu link de doador" com o link mascarado e "Copiar link". */
export function DonorBanner({ link }: { link: string }) {
  const toast = useToast();
  const url = new URL(link);
  const key = url.searchParams.get("k") ?? "";
  const masked = `${url.host}/minhas?k=${key.slice(0, 4)}-•••`;

  async function copy() {
    try {
      await navigator.clipboard.writeText(link);
      toast("Link copiado. Guarde em um lugar seguro.");
    } catch {
      toast("Não foi possível copiar agora.", "error");
    }
  }

  return (
    <section
      aria-label="Seu link de doador"
      className="flex flex-col gap-4 rounded-card border border-border bg-surface p-4 sm:flex-row sm:items-center sm:px-5"
    >
      <div className="flex flex-1 items-start gap-4">
        <span aria-hidden="true" className="flex size-10 shrink-0 items-center justify-center rounded-control bg-accent-pale">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <circle cx="8" cy="15" r="4" stroke="#B85D1C" strokeWidth="1.8" />
            <path d="M11 12L20 3M17 6L20 9M15 8L17 10" stroke="#B85D1C" strokeWidth="1.8" strokeLinecap="round" />
          </svg>
        </span>
        <div>
          <p className="text-sm font-bold">Você está acessando pelo seu link de doador</p>
          <p className="text-caption text-text-2">
            Qualquer pessoa com este link consegue gerenciar suas doações — não compartilhe.
          </p>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <code className="min-w-0 flex-1 truncate rounded-lg border border-border bg-bg px-3 py-2.5 text-[13px] sm:flex-none">
          {masked}
        </code>
        <Button variant="neutral" size="sm" onClick={() => void copy()}>
          Copiar link
        </Button>
      </div>
    </section>
  );
}
