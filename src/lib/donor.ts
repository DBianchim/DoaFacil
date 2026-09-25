import "server-only";

import { createHash, randomBytes } from "node:crypto";
import { cookies, headers } from "next/headers";
import { supabaseAdmin } from "@/lib/supabase/server";

/*
 * Chave do doador (ver CLAUDE.md): um link por pessoa, não por anúncio.
 * - A chave fica só no navegador (cookie httpOnly) e no link /minhas?k=CHAVE.
 * - O banco guarda apenas sha256(chave) em donors.key_hash.
 */

export const DONOR_COOKIE = "doador";
export const DONOR_COOKIE_MAX_AGE = 60 * 60 * 24 * 400; // ~13 meses (renovado a cada publicação)

/** 18 bytes aleatórios → 24 caracteres base64url (144 bits). */
export const generateDonorKey = () => randomBytes(18).toString("base64url");

export const isDonorKey = (v: unknown): v is string => typeof v === "string" && /^[A-Za-z0-9_-]{20,64}$/.test(v);

export const hashDonorKey = (key: string) => createHash("sha256").update(key).digest("hex");

export const donorCookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  path: "/",
  maxAge: DONOR_COOKIE_MAX_AGE,
};

/** Chave guardada neste navegador (ou null). */
export async function currentDonorKey(): Promise<string | null> {
  const value = (await cookies()).get(DONOR_COOKIE)?.value;
  return isDonorKey(value) ? value : null;
}

/** Doador da chave deste navegador, se existir no banco. */
export async function currentDonor(): Promise<{ id: string; key: string } | null> {
  const key = await currentDonorKey();
  if (!key) return null;
  const { data } = await supabaseAdmin().from("donors").select("id").eq("key_hash", hashDonorKey(key)).maybeSingle();
  return data ? { id: data.id, key } : null;
}

/**
 * Doador para uma nova publicação: reaproveita a chave do navegador ou cria
 * uma nova. Só pode ser chamado em Server Action (grava o cookie).
 */
export async function getOrCreateDonor(): Promise<{ id: string; key: string }> {
  const key = (await currentDonorKey()) ?? generateDonorKey();
  const keyHash = hashDonorKey(key);
  const db = supabaseAdmin();

  const { data: existing } = await db.from("donors").select("id").eq("key_hash", keyHash).maybeSingle();
  let id = existing?.id;
  if (!id) {
    const { data, error } = await db.from("donors").insert({ key_hash: keyHash }).select("id").single();
    if (error) throw new Error(`Falha ao criar doador: ${error.message}`);
    id = data.id;
  }

  (await cookies()).set(DONOR_COOKIE, key, donorCookieOptions);
  return { id, key };
}

/** Endereço público do site, para montar o link do doador. */
export async function siteOrigin(): Promise<string> {
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "localhost:3000";
  const proto = h.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https");
  return `${proto}://${host}`;
}

export const donorLink = (origin: string, key: string) => `${origin}/minhas?k=${key}`;
