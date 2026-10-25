import "server-only";

import { createHash, createHmac, randomBytes, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { hasCondoAccess } from "@/lib/condo";
import { hashPassword, verifyPassword } from "@/lib/password-hash";
import { supabaseAdmin } from "@/lib/supabase/server";

/*
 * Acesso do síndico (/admin e /cartaz).
 *
 * Senha: se o síndico já criou a própria senha, vale o hash em admin_config
 * (scrypt). Senão, vale a variável ADMIN_PASSWORD da Vercel — e o painel pede
 * para criar a senha no primeiro acesso, junto com um código de recuperação.
 *
 * "Esqueci a senha" (/admin/recuperar): o código de recuperação permite criar
 * uma senha nova sem falar com ninguém. Cada código vale uma vez; ao usar,
 * outro é gerado. Último recurso: scripts/redefinir-senha-admin.mjs.
 *
 * Sessão: o cookie guarda um HMAC derivado da senha vigente. Não dá para forjar,
 * e trocar a senha derruba todas as sessões abertas.
 */

export const ADMIN_COOKIE = "admin";
const SESSION_HOURS = 12;
export const MIN_PASSWORD_LENGTH = 12;

type AdminConfig = { password_hash: string; recovery_hash: string | null };

/**
 * Estado da configuração da senha:
 * - "missing-table": a migração ainda não foi aplicada (vale a ADMIN_PASSWORD, sem recuperação)
 * - null: ainda ninguém criou senha própria (vale a ADMIN_PASSWORD)
 * - AdminConfig: senha própria (e código de recuperação, se houver)
 */
async function loadConfig(): Promise<AdminConfig | null | "missing-table"> {
  const { data, error } = await supabaseAdmin()
    .from("admin_config")
    .select("password_hash, recovery_hash")
    .eq("id", true)
    .maybeSingle();
  if (error) {
    console.warn("admin_config indisponível:", error.message);
    return "missing-table";
  }
  return data;
}

export type AdminSetup = "ready" | "needs-setup" | "missing-table";

/** Se o painel deve pedir a criação da senha própria (primeiro acesso). */
export async function adminSetup(): Promise<AdminSetup> {
  const config = await loadConfig();
  if (config === "missing-table") return "missing-table";
  return config ? "ready" : "needs-setup";
}

const envPassword = () => process.env.ADMIN_PASSWORD || null;

async function sessionToken(): Promise<string | null> {
  const config = await loadConfig();
  const secret = config && config !== "missing-table" ? config.password_hash : envPassword();
  if (!secret) return null;
  return createHmac("sha256", secret).update("doafacil:admin:v1").digest("base64url");
}

export async function passwordMatches(typed: string): Promise<boolean> {
  const config = await loadConfig();
  if (config && config !== "missing-table") return verifyPassword(typed, config.password_hash);
  const env = envPassword();
  if (!env) return false;
  // Compara em tempo constante (via hash, que iguala os tamanhos).
  return timingSafeEqual(createHash("sha256").update(typed).digest(), createHash("sha256").update(env).digest());
}

// ---- Código de recuperação ----------------------------------------------------

const RECOVERY_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // sem 0/O, 1/I

/** 20 caracteres aleatórios (100 bits) em 4 grupos: K7QPM-2XRTA-9HJWE-4NBVC */
function generateRecoveryCode(): string {
  const chars = Array.from(randomBytes(20), (b) => RECOVERY_ALPHABET[b % RECOVERY_ALPHABET.length]).join("");
  return chars.match(/.{5}/g)!.join("-");
}

/** Aceita o código com ou sem hífens, espaços e maiúsculas. */
const normalizeRecoveryCode = (code: string) => code.toUpperCase().replace(/[^A-Z0-9]/g, "");

export async function recoveryCodeMatches(typed: string): Promise<boolean> {
  const config = await loadConfig();
  if (!config || config === "missing-table" || !config.recovery_hash) return false;
  const normalized = normalizeRecoveryCode(typed);
  if (normalized.length !== 20) return false;
  return verifyPassword(normalized, config.recovery_hash);
}

/** Se existe código de recuperação cadastrado (para a tela "Esqueci a senha"). */
export async function hasRecoveryCode(): Promise<boolean> {
  const config = await loadConfig();
  return Boolean(config && config !== "missing-table" && config.recovery_hash);
}

/**
 * Grava a senha nova (só o hash). Com newRecoveryCode, troca também o código de
 * recuperação e devolve o código em texto — que só será mostrado uma vez.
 * As sessões antigas deixam de valer.
 */
export async function setAdminPassword(
  password: string,
  { newRecoveryCode }: { newRecoveryCode: boolean },
): Promise<string | null> {
  const code = newRecoveryCode ? generateRecoveryCode() : null;
  const row = {
    id: true,
    password_hash: await hashPassword(password),
    updated_at: new Date().toISOString(),
    ...(code ? { recovery_hash: await hashPassword(normalizeRecoveryCode(code)) } : {}),
  };
  const { error } = await supabaseAdmin().from("admin_config").upsert(row);
  if (error) throw new Error(`Falha ao salvar a senha: ${error.message}`);
  return code;
}

/** Troca só o código de recuperação (a senha continua a mesma). */
export async function regenerateRecoveryCode(): Promise<string> {
  const code = generateRecoveryCode();
  const { data, error } = await supabaseAdmin()
    .from("admin_config")
    .update({ recovery_hash: await hashPassword(normalizeRecoveryCode(code)), updated_at: new Date().toISOString() })
    .eq("id", true)
    .select("id");
  if (error || !data?.length) throw new Error(`Falha ao gerar o código: ${error?.message ?? "senha própria não criada"}`);
  return code;
}

// ---- Sessão ----------------------------------------------------------------

export async function startAdminSession() {
  const token = await sessionToken();
  if (!token) return;
  (await cookies()).set(ADMIN_COOKIE, token, {
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
  const expected = await sessionToken();
  if (!expected) return false;
  const a = Buffer.from(value);
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}

/** Para páginas e ações do síndico: sem sessão, volta para o login do /admin. */
export async function requireAdmin(): Promise<void> {
  if (!(await isAdmin())) redirect("/admin");
}
