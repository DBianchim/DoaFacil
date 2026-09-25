"use client";

import { useId, useState } from "react";
import { Button, useToast } from "@/components/ui";

/** Link de doador com copiar, enviar para o próprio WhatsApp/e-mail e favoritos. */
export function DonorLinkCard({ link, compact }: { link: string; compact?: boolean }) {
  const toast = useToast();
  const id = useId();
  const [copied, setCopied] = useState(false);
  const [email, setEmail] = useState("");

  const message = `Meu link de doador do Doa Fácil (para gerenciar minhas doações): ${link}`;

  async function copy() {
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      toast("Link copiado. Guarde em um lugar seguro.");
      setTimeout(() => setCopied(false), 2500);
    } catch {
      toast("Não foi possível copiar. Selecione o link e copie manualmente.", "error");
    }
  }

  function sendEmail(e: React.FormEvent) {
    e.preventDefault();
    const subject = "Meu link de doador do Doa Fácil";
    window.location.href = `mailto:${encodeURIComponent(email.trim())}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(message)}`;
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <label htmlFor={`${id}-link`} className="text-[13px] font-semibold">
          Seu link de doador
        </label>
        <div className="flex flex-col gap-2 sm:flex-row">
          <input
            id={`${id}-link`}
            type="text"
            readOnly
            value={link}
            onFocus={(e) => e.currentTarget.select()}
            className="min-h-11 min-w-0 flex-1 rounded-control border-[1.5px] border-border bg-bg px-3.5 font-mono text-[13px] text-text"
          />
          <Button onClick={() => void copy()} variant={copied ? "whatsapp" : "primary"} aria-live="polite">
            {copied ? "Copiado!" : "Copiar link"}
          </Button>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <a
          href={`https://wa.me/?text=${encodeURIComponent(message)}`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex min-h-11 items-center gap-2 rounded-control border-[1.5px] border-border bg-surface px-4 text-sm font-semibold text-text hover:border-primary-light"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path d="M4 20L5.2 16.4C4.4 15.1 4 13.6 4 12C4 7.6 7.6 4 12 4C16.4 4 20 7.6 20 12C20 16.4 16.4 20 12 20C10.5 20 9.1 19.6 7.8 18.9L4 20Z" stroke="#1F7A4D" strokeWidth="1.8" strokeLinejoin="round" />
          </svg>
          Enviar para meu WhatsApp
          <span className="sr-only">(abre em outra aba)</span>
        </a>
        <button
          type="button"
          onClick={() =>
            toast(
              /Mobi|Android|iPhone/i.test(navigator.userAgent)
                ? "Abra o link acima e use Compartilhar › Adicionar aos favoritos."
                : "Abra o link acima e pressione Ctrl+D (⌘+D no Mac) para salvar nos favoritos.",
              "info",
            )
          }
          className="inline-flex min-h-11 items-center gap-2 rounded-control border-[1.5px] border-border bg-surface px-4 text-sm font-semibold text-text hover:border-primary-light"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path d="M6 4h12v17l-6-4-6 4V4Z" stroke="#2D6A4F" strokeWidth="1.8" strokeLinejoin="round" />
          </svg>
          Salvar nos favoritos
        </button>
      </div>

      {!compact && (
        <form onSubmit={sendEmail} className="flex flex-col gap-1.5 border-t border-divider pt-4">
          <label htmlFor={`${id}-email`} className="text-[13px] font-semibold">
            Quer receber o link por e-mail?{" "}
            <span className="font-medium text-text-2">(opcional, ajuda se você trocar de celular)</span>
          </label>
          <div className="flex flex-col gap-2 sm:flex-row">
            <input
              id={`${id}-email`}
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="voce@email.com"
              aria-describedby={`${id}-email-hint`}
              className="min-h-11 min-w-0 flex-1 rounded-control border-[1.5px] border-border bg-bg px-3.5 text-sm focus:border-primary focus:bg-surface"
            />
            <Button type="submit" variant="secondary">
              Enviar
            </Button>
          </div>
          <p id={`${id}-email-hint`} className="text-xs text-text-2">
            Abre o seu aplicativo de e-mail com o link pronto para você mandar para si mesmo. Não guardamos o seu e-mail.
          </p>
        </form>
      )}
    </div>
  );
}
