import "server-only";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { env } from "@/lib/env";
import { CONDO_COOKIE, condoToken, safeEqual } from "@/lib/condo-token";

/*
 * Checagem do acesso do condomínio dentro do servidor.
 * O proxy já bloqueia quem não tem o cookie, mas toda página, Server Action e
 * Route Handler que mexe com dados deve chamar uma destas funções também
 * (regra 3 do CLAUDE.md): o proxy sozinho não é garantia.
 */

export async function hasCondoAccess(): Promise<boolean> {
  const jar = await cookies();
  const expected = await condoToken(env.condoCode, env.condoCodeVersion);
  return safeEqual(jar.get(CONDO_COOKIE)?.value, expected);
}

/** Para páginas e Server Actions: manda para /entrar se não tiver acesso. */
export async function requireCondoAccess(): Promise<void> {
  if (!(await hasCondoAccess())) redirect("/entrar");
}
