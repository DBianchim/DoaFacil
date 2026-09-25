import { EmptyState } from "@/components/items/EmptyState";
import { ButtonLink } from "@/components/ui";

export default function ItemNotFound() {
  return (
    <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-16">
      <EmptyState
        icon="📦"
        title="Este anúncio não está mais no mural"
        action={<ButtonLink href="/explorar">Ver outras doações</ButtonLink>}
      >
        Ele pode ter expirado ou sido removido pelo doador. Anúncios ficam no ar por 30 dias.
      </EmptyState>
    </main>
  );
}
