"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { endAdminSession, isAdmin, passwordMatches, startAdminSession } from "@/lib/admin";
import { PHOTO_BUCKET, thumbPath } from "@/lib/catalog";
import { hasCondoAccess } from "@/lib/condo";
import { allowRequest, isUuid } from "@/lib/rate-limit";
import { supabaseAdmin } from "@/lib/supabase/server";

export type LoginState = { error?: string };

export async function entrarAdmin(_prev: LoginState, fd: FormData): Promise<LoginState> {
  if (!(await hasCondoAccess())) return { error: "Entre primeiro com o código do condomínio." };
  // 5 tentativas a cada 15 minutos por visitante: inviabiliza chutar a senha.
  if (!(await allowRequest("admin-login", 5, 15 * 60))) {
    return { error: "Muitas tentativas. Aguarde 15 minutos e tente de novo." };
  }
  const password = fd.get("password");
  if (typeof password !== "string" || !passwordMatches(password)) return { error: "Senha incorreta." };
  await startAdminSession();
  redirect("/admin");
}

export async function sairAdmin() {
  await endAdminSession();
  redirect("/admin");
}

export type AdminResult = { ok: true; message: string } | { ok: false; error: string };

export async function removerAnuncio(itemId: string): Promise<AdminResult> {
  if (!(await isAdmin())) return { ok: false, error: "Sua sessão de síndico expirou. Entre de novo." };
  if (!isUuid(itemId)) return { ok: false, error: "Anúncio não encontrado." };

  const db = supabaseAdmin();
  const { data, error } = await db.from("items").delete().eq("id", itemId).select("photos");
  if (error) return { ok: false, error: "Não foi possível remover agora. Tente de novo." };
  if (!data?.length) return { ok: false, error: "Este anúncio já não existe." };

  const photos = data[0].photos;
  if (photos.length > 0) {
    const { error: stError } = await db.storage.from(PHOTO_BUCKET).remove(photos.flatMap((p) => [p, thumbPath(p)]));
    if (!stError) await db.from("photo_cleanup_queue").delete().in("path", photos);
  }

  revalidatePath("/admin");
  revalidatePath("/");
  revalidatePath("/explorar");
  return { ok: true, message: "Anúncio removido e contatos apagados." };
}

export async function ignorarDenuncias(itemId: string): Promise<AdminResult> {
  if (!(await isAdmin())) return { ok: false, error: "Sua sessão de síndico expirou. Entre de novo." };
  if (!isUuid(itemId)) return { ok: false, error: "Anúncio não encontrado." };

  const { data, error } = await supabaseAdmin().from("items").update({ reports: 0 }).eq("id", itemId).select("id");
  if (error) return { ok: false, error: "Não foi possível atualizar agora. Tente de novo." };
  if (!data?.length) return { ok: false, error: "Este anúncio já não existe." };

  revalidatePath("/admin");
  return { ok: true, message: "Denúncias arquivadas. O anúncio continua no mural." };
}
