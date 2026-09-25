import "server-only";

import { createHmac } from "node:crypto";
import { headers } from "next/headers";
import { env } from "@/lib/env";
import { supabaseAdmin } from "@/lib/supabase/server";

/**
 * Identificador anônimo de quem faz a requisição: HMAC do IP com um segredo
 * do servidor. O IP em si nunca é gravado.
 */
export async function visitorId(): Promise<string> {
  const h = await headers();
  const ip = h.get("x-forwarded-for")?.split(",")[0]?.trim() || h.get("x-real-ip") || "local";
  return createHmac("sha256", env.supabaseServiceRoleKey).update(`visitante:${ip}`).digest("base64url").slice(0, 32);
}

/**
 * Rate limit por janela fixa, guardado no banco (funciona entre instâncias da Vercel).
 * Devolve true se ainda pode; false se passou do limite. Se o banco falhar, libera
 * (melhor aceitar um clique a mais do que travar o site).
 */
export async function allowRequest(action: string, max: number, windowSeconds: number, scope = ""): Promise<boolean> {
  const key = `${action}:${scope ? `${scope}:` : ""}${await visitorId()}`;
  const { data, error } = await supabaseAdmin().rpc("consumir_rate_limit", {
    p_key: key,
    p_max: max,
    p_window_seconds: windowSeconds,
  });
  if (error) {
    console.error("rate limit indisponível:", error.message);
    return true;
  }
  return data === true;
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
export const isUuid = (v: unknown): v is string => typeof v === "string" && UUID.test(v);
