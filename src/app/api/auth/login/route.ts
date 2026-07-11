import { NextRequest } from "next/server";
import bcrypt from "bcryptjs";
import { randomUUID } from "crypto";
import { prisma } from "@/lib/db";
import { signToken, COOKIE_NAME } from "@/lib/auth";

export async function POST(req: NextRequest) {
  const { email, dob, password } = await req.json().catch(() => ({}));

  if (!email || !dob || !password) {
    return Response.json(
      { error: "Email, date of birth and password are all required." },
      { status: 400 }
    );
  }

  const user = await prisma.user.findUnique({ where: { email: String(email).toLowerCase() } });
  const invalid = Response.json(
    { error: "Invalid credentials. Check email, date of birth and password." },
    { status: 401 }
  );
  if (!user) return invalid;

  // All three factors must match.
  if (user.dob !== dob) return invalid;
  if (!bcrypt.compareSync(password, user.passwordHash)) return invalid;

  if (user.status === "paused") {
    return Response.json(
      { error: "Your account is temporarily suspended. Contact administrator." },
      { status: 403 }
    );
  }
  if (user.status !== "active") return invalid;

  // Deactivate previous sessions, then open a new one (drives re-login lead view).
  await prisma.session.updateMany({ where: { userId: user.id }, data: { isActive: false } });
  const sessionId = randomUUID();
  await prisma.session.create({ data: { id: sessionId, userId: user.id } });

  const token = await signToken({
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    sessionId,
  });

  const res = Response.json({
    user: { id: user.id, name: user.name, email: user.email, role: user.role },
  });
  res.headers.set(
    "Set-Cookie",
    `${COOKIE_NAME}=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${12 * 60 * 60}`
  );
  return res;
}
