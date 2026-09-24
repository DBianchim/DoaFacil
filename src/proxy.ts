import { NextResponse, type NextRequest } from "next/server";
import {
  CONDO_COOKIE,
  CONDO_COOKIE_MAX_AGE,
  condoToken,
  normalizeCode,
  safeEqual,
  safeNextPath,
} from "@/lib/condo-token";

/*
 * Acesso coletivo pelo código do condomínio (ver CLAUDE.md).
 * - /entrar?c=CODIGO válido → grava o cookie e volta para onde a pessoa ia.
 * - Sem cookie válido → páginas vão para /entrar; /api responde 401.
 */
export async function proxy(req: NextRequest) {
  const code = process.env.CONDO_CODE;
  const version = process.env.CONDO_CODE_VERSION;
  if (!code || !version) {
    return new NextResponse("Configuração incompleta: defina CONDO_CODE e CONDO_CODE_VERSION.", { status: 500 });
  }

  const { pathname, search, searchParams } = req.nextUrl;
  const expected = await condoToken(code, version);
  const hasAccess = safeEqual(req.cookies.get(CONDO_COOKIE)?.value, expected);

  if (pathname === "/entrar") {
    const typed = searchParams.get("c");
    const next = safeNextPath(searchParams.get("next")) ?? "/";

    if (typed !== null) {
      if (normalizeCode(typed) !== "" && normalizeCode(typed) === normalizeCode(code)) {
        const res = NextResponse.redirect(new URL(next, req.url));
        res.cookies.set(CONDO_COOKIE, expected, {
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          sameSite: "lax",
          path: "/",
          maxAge: CONDO_COOKIE_MAX_AGE,
        });
        return res;
      }
      // Código errado: a página mostra o erro.
      return NextResponse.next();
    }

    // Já tem acesso e abriu /entrar sem código: nada a fazer aqui.
    if (hasAccess) return NextResponse.redirect(new URL(next, req.url));
    return NextResponse.next();
  }

  if (hasAccess) return NextResponse.next();

  if (pathname.startsWith("/api/")) {
    return NextResponse.json({ error: "Acesso restrito aos moradores." }, { status: 401 });
  }

  const login = new URL("/entrar", req.url);
  if (pathname !== "/") login.searchParams.set("next", pathname + search);
  return NextResponse.redirect(login);
}

export const config = {
  // Tudo, menos arquivos do Next e arquivos públicos estáticos.
  matcher: ["/((?!_next/static|_next/image|favicon.ico|robots.txt).*)"],
};
