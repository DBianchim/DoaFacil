import "server-only";

import { supabaseAdmin } from "@/lib/supabase/server";

export type ImpactStats = { donated: number; contacts: number; available: number };

/**
 * Números de impacto (itens doados, contatos feitos, disponíveis agora).
 * Não são dados pessoais, por isso também aparecem na tela /entrar.
 * Devolve null se o banco estiver fora do ar — quem chama esconde os números.
 */
export async function getImpactStats(): Promise<ImpactStats | null> {
  try {
    const db = supabaseAdmin();
    const [totals, available] = await Promise.all([
      db.from("impact_stats").select("donated, contacts").single(),
      db
        .from("items")
        .select("id", { count: "exact", head: true })
        .eq("status", "disponivel")
        .gt("expires_at", new Date().toISOString()),
    ]);
    if (totals.error || available.error) return null;
    return { donated: totals.data.donated, contacts: totals.data.contacts, available: available.count ?? 0 };
  } catch {
    return null;
  }
}

const numberFormat = new Intl.NumberFormat("pt-BR");
export const formatNumber = (n: number) => numberFormat.format(n);
