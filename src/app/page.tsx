import { ButtonLink, Logo } from "@/components/ui";

// Provisório: a Home real entra na etapa 4.
export default function Home() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-6 px-4 text-center">
      <Logo />
      <h1 className="text-h3 sm:text-h2">Em construção</h1>
      <p className="max-w-md text-text-2">A estrutura do projeto está pronta. Veja os componentes base na vitrine.</p>
      <ButtonLink href="/componentes">Ver componentes</ButtonLink>
    </main>
  );
}
