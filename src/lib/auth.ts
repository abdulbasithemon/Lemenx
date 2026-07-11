import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { prisma } from "./db";

const SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "lemenx-dev-secret-change-in-production"
);

export const COOKIE_NAME = "lemenx_session";

export type Role = "super_admin" | "manager" | "agent";

export interface AuthUser {
  id: number;
  name: string;
  email: string;
  role: Role;
  sessionId: string;
}

export async function signToken(payload: {
  id: number;
  name: string;
  email: string;
  role: string;
  sessionId: string;
}): Promise<string> {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("12h")
    .sign(SECRET);
}

export async function verifyToken(token: string): Promise<AuthUser | null> {
  try {
    const { payload } = await jwtVerify(token, SECRET);
    return payload as unknown as AuthUser;
  } catch {
    return null;
  }
}

/** Reads the session cookie, verifies the JWT and refreshes session activity. */
export async function getAuthUser(): Promise<AuthUser | null> {
  const store = await cookies();
  const token = store.get(COOKIE_NAME)?.value;
  if (!token) return null;
  const user = await verifyToken(token);
  if (!user) return null;

  // Ensure the account is still active (pause/delete takes effect immediately).
  const dbUser = await prisma.user.findUnique({ where: { id: user.id } });
  if (!dbUser || dbUser.status !== "active") return null;

  await prisma.session
    .update({ where: { id: user.sessionId }, data: { lastActivity: new Date(), isActive: true } })
    .catch(() => null);

  return user;
}

export async function requireRole(...roles: Role[]): Promise<AuthUser> {
  const user = await getAuthUser();
  if (!user) throw new AuthError(401, "Not authenticated");
  if (roles.length && !roles.includes(user.role)) throw new AuthError(403, "Not authorized");
  return user;
}

export class AuthError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

export function errorResponse(e: unknown): Response {
  if (e instanceof AuthError) {
    return Response.json({ error: e.message }, { status: e.status });
  }
  console.error(e);
  return Response.json({ error: "Internal server error" }, { status: 500 });
}
