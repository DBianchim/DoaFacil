"use server";

import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { hasCondoAccess } from "@/lib/condo";
import { isCategory, isCondition, MAX_PHOTOS, PHOTO_BUCKET, thumbPath } from "@/lib/catalog";
import { getOrCreateDonor } from "@/lib/donor";
import {
  CHANNEL_ERRORS,
  CHANNELS,
  LIMITS,
  normalizeChannel,
  PHOTO_MAX_BYTES,
  THUMB_MAX_BYTES,
  type ChannelKey,
} from "@/lib/publish-rules";
import { allowRequest } from "@/lib/rate-limit";
import { supabaseAdmin } from "@/lib/supabase/server";

export type PublishResult =
  | { ok: true; itemId: string }
  | { ok: false; error: string; fieldErrors?: Record<string, string> };

const text = (fd: FormData, name: string) => {
  const v = fd.get(name);
  return typeof v === "string" ? v.trim() : "";
};

/** Confere a assinatura do arquivo (não confia no tipo informado pelo navegador). */
async function imageType(file: File): Promise<"image/webp" | "image/jpeg" | null> {
  const b = new Uint8Array(await file.slice(0, 12).arrayBuffer());
  if (b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff) return "image/jpeg";
  const ascii = String.fromCharCode(...b);
  if (ascii.startsWith("RIFF") && ascii.slice(8, 12) === "WEBP") return "image/webp";
  return null;
}

export async function publicarDoacao(fd: FormData): Promise<PublishResult> {
  // Regra 3: toda ação verifica o cookie do condomínio.
  if (!(await hasCondoAccess())) return { ok: false, error: "Seu acesso expirou. Entre de novo com o código do condomínio." };

  if (!(await allowRequest("publicar", 5, 60 * 60))) {
    return { ok: false, error: "Você publicou muitas doações em pouco tempo. Tente de novo daqui a uma hora." };
  }

  // ---- Validação -----------------------------------------------------------
  const fieldErrors: Record<string, string> = {};

  const title = text(fd, "title");
  if (title.length < LIMITS.title.min || title.length > LIMITS.title.max)
    fieldErrors.title = `O título precisa ter entre ${LIMITS.title.min} e ${LIMITS.title.max} caracteres.`;

  const category = text(fd, "category");
  if (!isCategory(category)) fieldErrors.category = "Escolha uma categoria.";

  const condition = text(fd, "condition");
  if (!isCondition(condition)) fieldErrors.condition = "Escolha a condição do item.";

  const description = text(fd, "description");
  if (description.length > LIMITS.description) fieldErrors.description = `Use até ${LIMITS.description} caracteres.`;

  const notes = text(fd, "notes");
  if (notes.length > LIMITS.notes) fieldErrors.notes = `Use até ${LIMITS.notes} caracteres.`;

  const nickname = text(fd, "nickname");
  if (nickname.length < LIMITS.nickname.min || nickname.length > LIMITS.nickname.max)
    fieldErrors.nickname = `O apelido precisa ter entre ${LIMITS.nickname.min} e ${LIMITS.nickname.max} caracteres.`;

  const block = text(fd, "block").toUpperCase();
  if (block.length > LIMITS.block) fieldErrors.block = `Use até ${LIMITS.block} caracteres.`;

  const pickupInfo = text(fd, "pickupInfo");
  if (pickupInfo.length > LIMITS.pickupInfo) fieldErrors.pickupInfo = `Use até ${LIMITS.pickupInfo} caracteres.`;

  const contacts: Partial<Record<ChannelKey, string>> = {};
  for (const { key } of CHANNELS) {
    const raw = text(fd, key);
    if (!raw) continue;
    const value = normalizeChannel(key, raw);
    if (value) contacts[key] = value;
    else fieldErrors[key] = CHANNEL_ERRORS[key];
  }
  if (Object.keys(contacts).length === 0 && !CHANNELS.some((c) => fieldErrors[c.key]))
    fieldErrors.channels = "Escolha pelo menos uma forma de contato.";

  if (fd.get("consent") !== "on")
    fieldErrors.consent = "Para publicar, autorize a exibição dos seus contatos para os interessados.";

  const photos = fd.getAll("photo").filter((f): f is File => f instanceof File && f.size > 0);
  const thumbs = fd.getAll("thumb").filter((f): f is File => f instanceof File && f.size > 0);
  if (photos.length > MAX_PHOTOS || photos.length !== thumbs.length) fieldErrors.photos = `Envie até ${MAX_PHOTOS} fotos.`;
  const types: ("image/webp" | "image/jpeg")[] = [];
  for (const [i, f] of photos.entries()) {
    const t = await imageType(f);
    const tt = thumbs[i] ? await imageType(thumbs[i]) : null;
    if (!t || !tt || f.size > PHOTO_MAX_BYTES || thumbs[i].size > THUMB_MAX_BYTES) {
      fieldErrors.photos = "Uma das fotos não pôde ser processada. Tente escolher outra.";
      break;
    }
    types.push(t);
  }

  if (Object.keys(fieldErrors).length > 0) {
    return { ok: false, error: "Confira os campos destacados.", fieldErrors };
  }

  // ---- Gravação ------------------------------------------------------------
  const db = supabaseAdmin();
  const storage = db.storage.from(PHOTO_BUCKET);
  const folder = `u/${randomUUID()}`;
  const uploaded: string[] = [];

  try {
    const paths: string[] = [];
    for (const [i, file] of photos.entries()) {
      const ext = types[i] === "image/webp" ? "webp" : "jpg";
      const path = `${folder}/${i}.${ext}`;
      const full = await storage.upload(path, file, { contentType: types[i], upsert: false });
      if (full.error) throw new Error(full.error.message);
      uploaded.push(path);
      const thumb = await storage.upload(thumbPath(path), thumbs[i], {
        contentType: (await imageType(thumbs[i]))!,
        upsert: false,
      });
      if (thumb.error) throw new Error(thumb.error.message);
      uploaded.push(thumbPath(path));
      paths.push(path);
    }

    const donor = await getOrCreateDonor();

    const { data: item, error: itemError } = await db
      .from("items")
      .insert({
        donor_id: donor.id,
        title,
        description: description || null,
        notes: notes || null,
        category: category as never,
        condition: condition as never,
        photos: paths,
        nickname,
        block: block || null,
        pickup_info: pickupInfo || null,
      })
      .select("id")
      .single();
    if (itemError) throw new Error(itemError.message);

    const { error: contactError } = await db.from("item_contacts").insert({
      item_id: item.id,
      whatsapp: contacts.whatsapp ?? null,
      phone: contacts.phone ?? null,
      email: contacts.email ?? null,
      instagram: contacts.instagram ?? null,
      consent_at: new Date().toISOString(),
    });
    if (contactError) {
      // Sem contato o anúncio não serve: desfaz (o gatilho enfileira as fotos para limpeza).
      await db.from("items").delete().eq("id", item.id);
      uploaded.length = 0;
      throw new Error(contactError.message);
    }

    revalidatePath("/");
    revalidatePath("/explorar");
    return { ok: true, itemId: item.id };
  } catch (e) {
    console.error("publicarDoacao:", e instanceof Error ? e.message : e);
    if (uploaded.length > 0) await storage.remove(uploaded);
    return { ok: false, error: "Não foi possível publicar agora. Suas informações continuam aqui — tente de novo em instantes." };
  }
}
