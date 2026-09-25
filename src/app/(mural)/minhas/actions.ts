"use server";

import { revalidatePath } from "next/cache";
import { hasCondoAccess } from "@/lib/condo";
import { ITEM_TTL_DAYS, PHOTO_BUCKET, thumbPath, type Status } from "@/lib/catalog";
import { currentDonor } from "@/lib/donor";
import { isUuid } from "@/lib/rate-limit";
import { supabaseAdmin } from "@/lib/supabase/server";

export type ActionResult = { ok: true; message: string } | { ok: false; error: string };

const NOT_FOUND: ActionResult = {
  ok: false,
  error: "Não encontramos este anúncio entre as suas doações. Ele pode ter expirado.",
};

/**
 * Regras 3 e 4 do CLAUDE.md: cookie do condomínio válido E o item precisa
 * pertencer ao doador da chave guardada neste navegador.
 */
async function authorize(itemId: string): Promise<{ donorId: string } | ActionResult> {
  if (!(await hasCondoAccess())) return { ok: false, error: "Seu acesso expirou. Entre de novo com o código do condomínio." };
  if (!isUuid(itemId)) return NOT_FOUND;
  const donor = await currentDonor();
  if (!donor) return { ok: false, error: "Abra o seu link de doador neste aparelho para gerenciar suas doações." };
  return { donorId: donor.id };
}

function refresh(itemId: string) {
  revalidatePath("/minhas");
  revalidatePath("/");
  revalidatePath("/explorar");
  revalidatePath(`/item/${itemId}`);
}

const STATUS_MESSAGES: Record<Status, string> = {
  reservado: "Item marcado como reservado. Novos vizinhos verão que ele já tem destino.",
  doado: "Doação concluída! Obrigado por fortalecer a comunidade.",
  disponivel: "Item disponível de novo no mural.",
};

export async function mudarStatus(itemId: string, status: Status): Promise<ActionResult> {
  const auth = await authorize(itemId);
  if ("ok" in auth) return auth;
  if (!(status in STATUS_MESSAGES)) return { ok: false, error: "Status inválido." };

  const { data, error } = await supabaseAdmin()
    .from("items")
    .update({ status })
    .eq("id", itemId)
    .eq("donor_id", auth.donorId)
    .select("id");
  if (error) return { ok: false, error: "Não foi possível atualizar agora. Tente de novo em instantes." };
  if (!data?.length) return NOT_FOUND;

  refresh(itemId);
  return { ok: true, message: STATUS_MESSAGES[status] };
}

export async function renovar(itemId: string): Promise<ActionResult> {
  const auth = await authorize(itemId);
  if ("ok" in auth) return auth;

  const expiresAt = new Date(Date.now() + ITEM_TTL_DAYS * 86_400_000).toISOString();
  const { data, error } = await supabaseAdmin()
    .from("items")
    .update({ expires_at: expiresAt })
    .eq("id", itemId)
    .eq("donor_id", auth.donorId)
    .gt("expires_at", new Date().toISOString())
    .select("id");
  if (error) return { ok: false, error: "Não foi possível renovar agora. Tente de novo em instantes." };
  if (!data?.length) return NOT_FOUND;

  refresh(itemId);
  return { ok: true, message: `Anúncio renovado por mais ${ITEM_TTL_DAYS} dias.` };
}

export async function remover(itemId: string): Promise<ActionResult> {
  const auth = await authorize(itemId);
  if ("ok" in auth) return auth;

  const db = supabaseAdmin();
  // Apagar o item apaga os contatos junto (on delete cascade).
  const { data, error } = await db
    .from("items")
    .delete()
    .eq("id", itemId)
    .eq("donor_id", auth.donorId)
    .select("photos");
  if (error) return { ok: false, error: "Não foi possível remover agora. Tente de novo em instantes." };
  if (!data?.length) return NOT_FOUND;

  // Remove as fotos já; se falhar, a fila de limpeza (preenchida pelo gatilho) tenta de novo no job diário.
  const photos = data[0].photos;
  if (photos.length > 0) {
    const { error: stError } = await db.storage.from(PHOTO_BUCKET).remove(photos.flatMap((p) => [p, thumbPath(p)]));
    if (!stError) await db.from("photo_cleanup_queue").delete().in("path", photos);
  }

  refresh(itemId);
  return { ok: true, message: "Publicação removida." };
}
