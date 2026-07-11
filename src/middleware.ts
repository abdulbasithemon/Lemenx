import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";

const SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "lemenx-dev-secret-change-in-production"
);
const COOKIE_NAME = "lemenx_session";

/** Page prefixes only reachable by certain roles. API routes enforce roles themselves. */
const ROLE_ROUTES: Record<string, string[]> = {
  "/dashboard/upload": ["super_admin"],
  "/dashboard/statuses": ["super_admin"],
  "/dashboard/users": ["super_admin", "manager"],
  "/dashboard/reports": ["super_admin", "manager"],
  "/dashboard/approvals": ["super_admin", "manager"],
  "/dashboard/leave": ["manager", "agent"],
};

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  const token = req.cookies.get(COOKIE_NAME)?.value;
  let role: string | null = null;
  if (token) {
    try {
      const { payload } = await jwtVerify(token, SECRET);
      role = (payload as { role?: string }).role ?? null;
    } catch {
      role = null;
    }
  }

  if (pathname === "/login") {
    if (role) return NextResponse.redirect(new URL("/dashboard", req.url));
    return NextResponse.next();
  }

  if (!role) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  for (const [prefix, roles] of Object.entries(ROLE_ROUTES)) {
    if (pathname.startsWith(prefix) && !roles.includes(role)) {
      return NextResponse.redirect(new URL("/dashboard", req.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/dashboard", "/login"],
};
