"use client";

import { useEffect } from "react";
import { Button, ButtonLink } from "@/components/ui";

/** Erro inesperado ao carregar o mural (ex.: banco fora do ar). */
export default function MuralError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="mx-auto flex w-full max-w-lg flex-1 flex-col items-center gap-4 px-4 py-20 text-center">
      <span aria-hidden="true" className="flex size-16 items-center justify-center rounded-2xl bg-danger-pale text-3xl">
        ⚠️
      </span>
      <h1 className="text-h3">Não conseguimos carregar o mural</h1>
      <p className="text-text-2">
        Pode ser uma instabilidade momentânea. Tente de novo em alguns segundos. Se continuar, avise o síndico.
      </p>
      <div className="flex flex-wrap justify-center gap-3">
        <Button onClick={reset}>Tentar de novo</Button>
        <ButtonLink href="/" variant="neutral">
          Voltar ao início
        </ButtonLink>
      </div>
    </main>
  );
}
