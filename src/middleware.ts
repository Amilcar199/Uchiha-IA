import { createServerClient } from "@supabase/ssr";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const PUBLIC_PATHS = new Set(["/login", "/register"]);

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  // O print vai no corpo. Renovar a sessão aqui clona esse corpo e a plataforma responde 500.
  if (request.method === "POST" && pathname === "/api/analyses") {
    return NextResponse.next();
  }
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api/auth") ||
    pathname === "/manifest.webmanifest" ||
    pathname === "/favicon.ico"
  ) {
    return NextResponse.next();
  }

  let response = NextResponse.next({ request });
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  let supabaseUser = false;

  if (url && key) {
    try {
      const supabase = createServerClient(url, key, {
        cookies: {
          getAll() {
            return request.cookies.getAll();
          },
          setAll(cookiesToSet) {
            for (const cookie of cookiesToSet) {
              request.cookies.set(cookie.name, cookie.value);
            }
            response = NextResponse.next({ request });
            for (const cookie of cookiesToSet) {
              response.cookies.set(cookie.name, cookie.value, cookie.options);
            }
          },
        },
      });
      const { data } = await supabase.auth.getUser();
      supabaseUser = Boolean(data.user);
    } catch {
      supabaseUser = false;
    }
  }

  const signedIn = Boolean(url && key)
    ? supabaseUser
    : Boolean(request.cookies.get("uchiha_session")?.value);

  const carryCookies = (next: NextResponse) => {
    for (const cookie of response.cookies.getAll()) {
      next.cookies.set(cookie);
    }
    return next;
  };

  if (pathname === "/") return response;

  if (PUBLIC_PATHS.has(pathname)) {
    if (signedIn) return carryCookies(NextResponse.redirect(new URL("/dashboard", request.url)));
    return response;
  }

  if (!signedIn) {
    if (pathname.startsWith("/api/")) {
      return carryCookies(
        NextResponse.json(
          { error: { code: "AUTH_001", message: "Entre na sua conta para continuar.", requestId: null } },
          { status: 401 },
        ),
      );
    }
    return carryCookies(NextResponse.redirect(new URL("/login", request.url)));
  }

  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image).*)"],
};
