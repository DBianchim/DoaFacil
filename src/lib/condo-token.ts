/*
 * Token do cookie de acesso do condomínio.
 *
 * O cookie NÃO guarda o CONDO_CODE_VERSION puro (ex.: "v1"): qualquer um
 * poderia criar esse cookie à mão e entrar sem o código. Ele guarda um
 * HMAC-SHA256 da versão usando o próprio código como chave — só quem sabe o
 * código consegue gerá-lo, e trocar o código OU a versão invalida todos.
 *
 * Sem "server-only" de propósito: é usado pelo proxy e pelo servidor.
 * Usa Web Crypto, disponível nos dois ambientes.
 */

export const CONDO_COOKIE = "condo";
export const CONDO_COOKIE_MAX_AGE = 60 * 60 * 24 * 180; // 6 meses

/** "fatto 4ubm", "FATTO-4UBM" e "Fatto4UBM" viram o mesmo código. */
export function normalizeCode(value: string): string {
  return value
    .normalize("NFKD")
    .replace(/[^a-zA-Z0-9]/g, "")
    .toUpperCase();
}

const cache = new Map<string, Promise<string>>();

export function condoToken(code: string, version: string): Promise<string> {
  const id = `${normalizeCode(code)}\u0000${version}`;
  let token = cache.get(id);
  if (!token) {
    token = computeToken(normalizeCode(code), version);
    cache.set(id, token);
  }
  return token;
}

async function computeToken(code: string, version: string): Promise<string> {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey("raw", enc.encode(code), { name: "HMAC", hash: "SHA-256" }, false, [
    "sign",
  ]);
  const sig = await crypto.subtle.sign("HMAC", key, enc.encode(`doafacil:condo:${version}`));
  return Buffer.from(sig).toString("base64url");
}

/** Comparação em tempo constante (evita medir quantos caracteres batem). */
export function safeEqual(a: string | undefined, b: string): boolean {
  if (a === undefined || a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

/** Aceita só caminhos internos ("/item/1"), nunca "//site.com" ou URLs absolutas. */
export function safeNextPath(value: string | null | undefined): string | null {
  if (!value || !value.startsWith("/") || value.startsWith("//") || value.startsWith("/\\")) return null;
  if (value.startsWith("/entrar")) return null;
  return value;
}
