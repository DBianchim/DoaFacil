import "server-only";

import { createHash, createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { hasCondoAccess } from "@/lib/condo";
import { env } from "@/lib/env";

/*
 * Acesso do síndico (/admin e /cartaz), protegido por ADMIN_PASSWORD.
 * O cookie guarda um HMAC derivado da senha: não dá para forjar sem saber a
 * senha, e trocar a senha na Vercel derruba todas as sessões.
 */

export const ADMIN_COOKIE = "admin";
const SESSION_HOURS = 12;

const sessionToken = () =>
  createHmac("sha256", env.adminPassword).update("doafacil:admin:v1").digest("base64url");

/** Compara em tempo constante (via hash, que iguala os tamanhos). */
export function passwordMatches(typed: string): boolean {
  const a = createHash("sha256").update(typed).digest();
  const b = createHash("sha256").update(env.adminPassword).digest();
  return timingSafeEqual(a, b);
}

export async function startAdminSession() {
  (await cookies()).set(ADMIN_COOKIE, sessionToken(), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
    maxAge: SESSION_HOURS * 60 * 60,
  });
}

export async function endAdminSession() {
  (await cookies()).delete(ADMIN_COOKIE);
}

export async function isAdmin(): Promise<boolean> {
  if (!(await hasCondoAccess())) return false;
  const value = (await cookies()).get(ADMIN_COOKIE)?.value;
  if (!value) return false;
  const a = Buffer.from(value);
  const b = Buffer.from(sessionToken());
  return a.length === b.length && timingSafeEqual(a, b);
}

/** Para páginas e ações do síndico: sem sessão, volta para o login do /admin. */
export async function requireAdmin(): Promise<void> {
  if (!(await isAdmin())) redirect("/admin");
}
