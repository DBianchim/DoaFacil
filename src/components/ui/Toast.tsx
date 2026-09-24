"use client";

import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from "react";

type ToastTone = "success" | "error" | "info";
type ToastState = { id: number; message: string; tone: ToastTone } | null;
type ShowToast = (message: string, tone?: ToastTone) => void;

const ToastContext = createContext<ShowToast | null>(null);

const DURATION_MS = 5000;

/** Mostra um aviso por vez; um novo substitui o anterior. */
export function ToastProvider({ children }: { children: ReactNode }) {
  const [toast, setToast] = useState<ToastState>(null);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);

  const show = useCallback<ShowToast>((message, tone = "success") => {
    setToast({ id: Date.now(), message, tone });
  }, []);

  useEffect(() => {
    if (!toast) return;
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setToast(null), DURATION_MS);
    return () => clearTimeout(timer.current);
  }, [toast]);

  return (
    <ToastContext.Provider value={show}>
      {children}
      {/* A região viva existe desde o início para que leitores de tela anunciem cada aviso. */}
      <div
        role="status"
        aria-live="polite"
        className="pointer-events-none fixed inset-x-4 bottom-24 z-50 flex justify-center md:bottom-7"
      >
        {toast && (
          <div
            key={toast.id}
            className="pointer-events-auto flex max-w-md animate-toast-in items-center gap-2.5 rounded-xl bg-text py-3 pr-2 pl-5 text-sm font-semibold text-white shadow-toast"
          >
            <ToastIcon tone={toast.tone} />
            <span className="py-1">{toast.message}</span>
            <button
              type="button"
              onClick={() => setToast(null)}
              aria-label="Fechar aviso"
              className="ml-1 flex size-11 shrink-0 items-center justify-center rounded-lg text-white/70 hover:bg-white/10 hover:text-white"
            >
              <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                <path d="M4 4l8 8M12 4l-8 8" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
              </svg>
            </button>
          </div>
        )}
      </div>
    </ToastContext.Provider>
  );
}

function ToastIcon({ tone }: { tone: ToastTone }) {
  if (tone === "error") {
    return (
      <svg className="size-[18px] shrink-0" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <circle cx="12" cy="12" r="9" stroke="#F97066" strokeWidth="2" />
        <path d="M12 7.5v5M12 16h.01" stroke="#F97066" strokeWidth="2.2" strokeLinecap="round" />
      </svg>
    );
  }
  if (tone === "info") {
    return (
      <svg className="size-[18px] shrink-0" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <circle cx="12" cy="12" r="9" stroke="#52B788" strokeWidth="2" />
        <path d="M12 11v5M12 8h.01" stroke="#52B788" strokeWidth="2.2" strokeLinecap="round" />
      </svg>
    );
  }
  return (
    <svg className="size-[18px] shrink-0" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M5 12.5l5 5L19 7" stroke="#52B788" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast precisa estar dentro de <ToastProvider>.");
  return ctx;
}
