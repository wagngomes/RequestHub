import { NextRequest, NextResponse } from "next/server";

// Nomes possíveis do cookie de sessão do BetterAuth
const SESSION_COOKIES = ["better-auth.session_token", "__session", "session"];
const PUBLIC_ROUTES = ["/login", "/api/auth", "/_next", "/favicon"];

/**
 * Proxy (Next.js 16) — verifica presença de cookie de sessão.
 * A validação real da sessão é feita em cada página via getServerSession().
 * Esta camada apenas redireciona usuários sem cookie para o login.
 */
export function proxy(request: NextRequest): NextResponse {
  const { pathname } = request.nextUrl;

  // Permitir rotas públicas e recursos estáticos
  if (PUBLIC_ROUTES.some((route) => pathname.startsWith(route))) {
    return NextResponse.next();
  }

  // Verificar presença de cookie de sessão (verificação leve, sem banco)
  const hasSession = SESSION_COOKIES.some(
    (name) => !!request.cookies.get(name)?.value
  );

  if (!hasSession) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("from", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
