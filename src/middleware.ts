import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const PUBLIC_PATHS = new Set(["/login", "/register"]);

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api/auth") ||
    pathname === "/manifest.webmanifest" ||
    pathname === "/favicon.ico"
  ) {
    return NextResponse.next();
  }

  const hasLocalSession = Boolean(request.cookies.get("uchiha_session")?.value);
  const hasSupabaseSession = request.cookies.getAll().some((cookie) => /auth-token(\.\d+)?$/.test(cookie.name));
  const signedIn = hasLocalSession || hasSupabaseSession;

  if (pathname === "/") return NextResponse.next();

  if (PUBLIC_PATHS.has(pathname)) {
    if (signedIn) return NextResponse.redirect(new URL("/dashboard", request.url));
    return NextResponse.next();
  }

  if (!signedIn) {
    if (pathname.startsWith("/api/")) {
      return NextResponse.json(
        { error: { code: "AUTH_001", message: "Entre na sua conta para continuar.", requestId: null } },
        { status: 401 },
      );
    }
    return NextResponse.redirect(new URL("/login", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image).*)"],
};
