"use client";

import { Button } from "@/components/ui";

export function PrintButton() {
  return (
    <Button size="lg" onClick={() => window.print()}>
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path d="M7 9V3h10v6M7 17H4v-7h16v7h-3M7 14h10v7H7v-7Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
      </svg>
      Imprimir cartaz
    </Button>
  );
}
