import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";

const secret = new TextEncoder().encode(process.env.SESSION_SECRET!);
const SESSION_COOKIE_NAME = "lpd_session";

const ROL_HOME: Record<string, string> = {
  seccion: "/seccion",
  compania: "/compania",
  comandante: "/comandante",
};

const ROL_PREFIX: Record<string, string> = {
  "/seccion": "seccion",
  "/compania": "compania",
  "/comandante": "comandante",
};

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;

  let rol: string | null = null;
  if (token) {
    try {
      const { payload } = await jwtVerify(token, secret);
      rol = (payload.rol as string) ?? null;
    } catch {
      rol = null;
    }
  }

  if (pathname === "/login") {
    if (rol && ROL_HOME[rol]) {
      return NextResponse.redirect(new URL(ROL_HOME[rol], request.url));
    }
    return NextResponse.next();
  }

  if (!rol) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  const matchedPrefix = Object.keys(ROL_PREFIX).find((p) =>
    pathname.startsWith(p)
  );
  if (matchedPrefix && ROL_PREFIX[matchedPrefix] !== rol) {
    return NextResponse.redirect(new URL(ROL_HOME[rol], request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next|favicon.ico).*)"],
};
