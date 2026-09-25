import type { Metadata } from "next";
import { ButtonLink, Logo } from "@/components/ui";

export const metadata: Metadata = { title: "Página não encontrada" };

export default function NotFound() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-5 px-4 py-16 text-center">
      <Logo />
      <h1 className="text-h3 sm:text-h2">Página não encontrada</h1>
      <p className="max-w-md text-text-2">
        O endereço pode estar incompleto ou a página foi removida. Volte ao mural para ver as doações.
      </p>
      <ButtonLink href="/">Voltar ao início</ButtonLink>
    </main>
  );
}
