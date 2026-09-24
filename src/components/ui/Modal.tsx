"use client";

import { useEffect, useId, useRef, type ReactNode } from "react";
import { cn } from "@/lib/cn";
import { Button } from "./Button";

type ModalProps = {
  open: boolean;
  onClose: () => void;
  title: ReactNode;
  description?: ReactNode;
  /** Elemento à esquerda do título (ex.: miniatura do item). */
  leading?: ReactNode;
  children?: ReactNode;
  footer?: ReactNode;
  size?: "sm" | "md";
  /** No celular vira bottom sheet (padrão). Diálogos de confirmação costumam ficar centrais. */
  sheetOnMobile?: boolean;
  /** "alertdialog" para confirmações destrutivas. */
  role?: "dialog" | "alertdialog";
  /** Esconde o botão X (use quando o rodapé já tem "Cancelar"). */
  hideClose?: boolean;
  className?: string;
};

/**
 * Modal baseado em <dialog> nativo: prende o foco, fecha com Esc,
 * devolve o foco a quem abriu e fica acima de todo o conteúdo.
 * Para focar um botão específico ao abrir, passe autoFocus nele.
 */
export function Modal({
  open,
  onClose,
  title,
  description,
  leading,
  children,
  footer,
  size = "md",
  sheetOnMobile = true,
  role = "dialog",
  hideClose,
  className,
}: ModalProps) {
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const descId = useId();

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) {
      dialog.showModal();
      const root = document.documentElement;
      const previous = root.style.overflow;
      root.style.overflow = "hidden";
      return () => {
        root.style.overflow = previous;
      };
    }
    if (!open && dialog.open) dialog.close();
  }, [open]);

  return (
    <dialog
      ref={ref}
      role={role === "alertdialog" ? "alertdialog" : undefined}
      aria-labelledby={titleId}
      aria-describedby={description ? descId : undefined}
      // Esc dispara "cancel"; deixamos o pai decidir fechar via estado.
      onCancel={(e) => {
        e.preventDefault();
        onClose();
      }}
      // Clique fora da caixa (no backdrop) fecha.
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      className={cn(
        "m-auto max-h-[calc(100dvh-2rem)] w-[calc(100%-2rem)] overflow-hidden rounded-panel bg-surface p-0 text-text shadow-modal",
        "open:flex open:flex-col open:animate-fade-in",
        size === "sm" ? "max-w-[440px]" : "max-w-[520px]",
        sheetOnMobile &&
          "max-sm:mb-0 max-sm:max-h-[90dvh] max-sm:w-full max-sm:max-w-none max-sm:rounded-b-none max-sm:open:animate-sheet-in",
        className,
      )}
    >
      {open && (
        <>
          {sheetOnMobile && (
            <div aria-hidden="true" className="mx-auto mt-2.5 h-[5px] w-10 shrink-0 rounded-full bg-[#D5DDD5] sm:hidden" />
          )}
          <div className="flex items-start justify-between gap-4 px-5 pt-4 pb-4 sm:px-7 sm:pt-7 sm:pb-5">
            <div className="flex min-w-0 items-center gap-3.5">
              {leading}
              <div className="min-w-0">
                <h2 id={titleId} className="text-lg font-extrabold tracking-tight sm:text-xl">
                  {title}
                </h2>
                {description && (
                  <p id={descId} className="mt-1 text-caption text-text-2">
                    {description}
                  </p>
                )}
              </div>
            </div>
            {!hideClose && (
              <button
                type="button"
                onClick={onClose}
                aria-label="Fechar"
                className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-bg text-text-2 transition-colors hover:bg-muted"
              >
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                  <path d="M4 4l8 8M12 4l-8 8" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                </svg>
              </button>
            )}
          </div>
          {children && <div className="min-h-0 flex-1 overflow-y-auto px-5 sm:px-7">{children}</div>}
          {footer && (
            <div className="flex flex-wrap items-center justify-end gap-2.5 px-5 pt-5 pb-[max(1.5rem,env(safe-area-inset-bottom))] sm:px-7">{footer}</div>
          )}
          {!footer && <div className="h-[max(1.5rem,env(safe-area-inset-bottom))] shrink-0" />}
        </>
      )}
    </dialog>
  );
}

type ConfirmDialogProps = {
  open: boolean;
  onCancel: () => void;
  onConfirm: () => void;
  title: ReactNode;
  children: ReactNode;
  confirmLabel: string;
  cancelLabel?: string;
  loading?: boolean;
  destructive?: boolean;
};

/** Confirmação antes de ações destrutivas (ex.: remover doação). O foco inicial fica em "Cancelar". */
export function ConfirmDialog({
  open,
  onCancel,
  onConfirm,
  title,
  children,
  confirmLabel,
  cancelLabel = "Cancelar",
  loading,
  destructive = true,
}: ConfirmDialogProps) {
  return (
    <Modal
      open={open}
      onClose={onCancel}
      title={title}
      description={children}
      role="alertdialog"
      size="sm"
      sheetOnMobile={false}
      hideClose
      footer={
        <>
          <Button variant="neutral" autoFocus onClick={onCancel}>
            {cancelLabel}
          </Button>
          <Button variant={destructive ? "danger" : "primary"} onClick={onConfirm} loading={loading}>
            {confirmLabel}
          </Button>
        </>
      }
    />
  );
}
