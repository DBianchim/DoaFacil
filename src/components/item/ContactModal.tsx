"use client";

import { useState } from "react";
import { Button, Modal, Skeleton } from "@/components/ui";
import type { ContactChannel, ContactResponse } from "@/lib/contact-types";
import { cn } from "@/lib/cn";

type Props = {
  itemId: string;
  title: string;
  nickname: string;
  block: string | null;
  thumb: { url?: string; icon: string; bg: string };
  disabled?: boolean;
};

type State =
  | { kind: "idle" }
  | { kind: "loading" }
  | { kind: "error"; message: string }
  | { kind: "ready"; data: ContactResponse };

/**
 * "Tenho interesse": abre o modal (bottom sheet no celular) e só então busca o
 * contato em POST /api/contato/[id]. O resultado fica guardado — reabrir o modal
 * não conta outro clique.
 */
export function ContactModal({ itemId, title, nickname, block, thumb, disabled }: Props) {
  const [open, setOpen] = useState(false);
  const [state, setState] = useState<State>({ kind: "idle" });

  async function load() {
    setState({ kind: "loading" });
    try {
      const res = await fetch(`/api/contato/${itemId}`, { method: "POST" });
      const body = await res.json().catch(() => null);
      if (!res.ok) {
        setState({ kind: "error", message: body?.error ?? "Não foi possível buscar o contato agora." });
        return;
      }
      setState({ kind: "ready", data: body as ContactResponse });
    } catch {
      setState({ kind: "error", message: "Sem conexão. Confira sua internet e tente de novo." });
    }
  }

  function openModal() {
    setOpen(true);
    if (state.kind === "idle" || state.kind === "error") void load();
  }

  const data = state.kind === "ready" ? state.data : null;

  return (
    <>
      <Button size="lg" fullWidth onClick={openModal} disabled={disabled} className="text-base font-bold">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path
            d="M12 20s-7-4.35-7-10a4 4 0 0 1 7-2.65A4 4 0 0 1 19 10c0 5.65-7 10-7 10Z"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinejoin="round"
          />
        </svg>
        {disabled ? "Este item já foi doado" : "Tenho interesse"}
      </Button>

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title={`Fale com ${nickname}`}
        description={`Sobre: ${title}${block ? ` · Bloco ${block}` : ""}`}
        leading={
          <span
            aria-hidden="true"
            className="hidden size-14 shrink-0 items-center justify-center overflow-hidden rounded-[14px] text-3xl sm:flex"
            style={{ backgroundColor: thumb.bg }}
          >
            {thumb.url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={thumb.url} alt="" className="size-full object-cover" />
            ) : (
              thumb.icon
            )}
          </span>
        }
      >
        <div aria-live="polite" className="flex flex-col gap-3">
          {state.kind === "loading" && (
            <div role="status" aria-busy="true" className="flex flex-col gap-3">
              <span className="sr-only">Buscando o contato…</span>
              <Skeleton className="h-4 w-48" />
              <Skeleton className="h-[68px] w-full rounded-[14px]" />
              <Skeleton className="h-14 w-full rounded-[14px]" />
            </div>
          )}

          {state.kind === "error" && (
            <div role="alert" className="flex flex-col items-start gap-3 rounded-xl border border-danger-border bg-danger-pale p-4">
              <p className="text-sm font-semibold text-danger-ink">{state.message}</p>
              <Button variant="neutral" size="sm" onClick={() => void load()}>
                Tentar de novo
              </Button>
            </div>
          )}

          {data && (
            <>
              <p className="text-caption font-semibold text-text-2">{data.nickname} prefere ser chamado por:</p>
              {data.channels.map((c) => (
                <ChannelLink key={c.kind} channel={c} />
              ))}
              {data.whatsappMessage && (
                <div className="rounded-xl border border-dashed border-disabled bg-bg px-3.5 py-3">
                  <p className="mb-1.5 text-badge font-bold tracking-wide text-text-2 uppercase">
                    Mensagem que será enviada
                  </p>
                  <p className="text-caption leading-relaxed">{data.whatsappMessage}</p>
                </div>
              )}
            </>
          )}

          <div className="mt-2 flex items-start gap-2.5 rounded-xl bg-accent-pale px-3.5 py-3">
            <svg className="mt-px size-4 shrink-0" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path d="M12 3L20 6V11C20 15.5 16.6 19.4 12 21C7.4 19.4 4 15.5 4 11V6L12 3Z" stroke="#B85D1C" strokeWidth="1.6" strokeLinejoin="round" />
            </svg>
            <p className="text-xs leading-relaxed text-accent-ink">
              Combine a retirada em área comum ou na portaria. Nunca é necessário pagar nada — aqui tudo é doação.
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
            <span className="text-xs text-text-2">
              {data &&
                (data.interestClicks === 1
                  ? "Você foi o primeiro a ver este contato"
                  : `${data.interestClicks} vizinhos já viram este contato`)}
            </span>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="min-h-11 rounded-lg px-2 text-caption font-semibold text-text-2 hover:text-text"
            >
              Voltar ao anúncio
            </button>
          </div>
        </div>
      </Modal>
    </>
  );
}

const CHANNEL_TEXT: Record<ContactChannel["kind"], { title: string; hint?: string }> = {
  whatsapp: { title: "Chamar no WhatsApp", hint: "Abre com a mensagem pronta" },
  email: { title: "Enviar e-mail" },
  phone: { title: "Ligar" },
  instagram: { title: "Mensagem no Instagram" },
};

function ChannelLink({ channel }: { channel: ContactChannel }) {
  const primary = channel.kind === "whatsapp";
  const text = CHANNEL_TEXT[channel.kind];
  const external = channel.kind === "whatsapp" || channel.kind === "instagram";
  return (
    <a
      href={channel.href}
      target={external ? "_blank" : undefined}
      rel={external ? "noopener noreferrer" : undefined}
      className={cn(
        "flex items-center gap-3.5 rounded-[14px] transition-colors",
        primary
          ? "bg-whatsapp px-[18px] py-4 text-white hover:bg-[#19663f]"
          : "border-[1.5px] border-border bg-surface px-[18px] py-3.5 text-text hover:border-primary-light",
      )}
    >
      <ChannelIcon kind={channel.kind} />
      <span className="flex min-w-0 flex-1 flex-col">
        <span className={cn("font-bold", primary ? "text-[15px]" : "text-sm")}>{text.title}</span>
        <span className={cn("truncate text-xs", primary ? "text-primary-pale" : "text-text-2")}>
          {primary ? text.hint : channel.display}
        </span>
      </span>
      {external && (
        <>
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
            <path d="M6 3H13V10M13 3L4 12" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <span className="sr-only">(abre em outra aba)</span>
        </>
      )}
    </a>
  );
}

function ChannelIcon({ kind }: { kind: ContactChannel["kind"] }) {
  const stroke = kind === "whatsapp" ? "#fff" : "#2D6A4F";
  if (kind === "whatsapp")
    return (
      <svg width="26" height="26" viewBox="0 0 24 24" fill="none" aria-hidden="true" className="shrink-0">
        <path d="M4 20L5.2 16.4C4.4 15.1 4 13.6 4 12C4 7.6 7.6 4 12 4C16.4 4 20 7.6 20 12C20 16.4 16.4 20 12 20C10.5 20 9.1 19.6 7.8 18.9L4 20Z" stroke={stroke} strokeWidth="1.7" strokeLinejoin="round" />
        <path d="M9 9.2C9 8.8 9.3 8.5 9.6 8.5H10.2L11 10.4L10.4 11.1C10.8 12 11.6 12.8 12.6 13.3L13.3 12.7L15.2 13.5V14.1C15.2 14.5 14.9 14.8 14.5 14.8C11.4 14.8 9 12.3 9 9.2Z" fill={stroke} />
      </svg>
    );
  if (kind === "email")
    return (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true" className="shrink-0">
        <rect x="3" y="5" width="18" height="14" rx="2.5" stroke={stroke} strokeWidth="1.7" />
        <path d="M4 7L12 13L20 7" stroke={stroke} strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  if (kind === "phone")
    return (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true" className="shrink-0">
        <path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a1 1 0 0 1-1 1A16 16 0 0 1 4 5a1 1 0 0 1 1-1Z" stroke={stroke} strokeWidth="1.7" strokeLinejoin="round" />
      </svg>
    );
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true" className="shrink-0">
      <rect x="3.5" y="3.5" width="17" height="17" rx="5" stroke={stroke} strokeWidth="1.7" />
      <circle cx="12" cy="12" r="4" stroke={stroke} strokeWidth="1.7" />
      <circle cx="17" cy="7" r="1" fill={stroke} />
    </svg>
  );
}
