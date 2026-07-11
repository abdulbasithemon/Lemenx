import { getAuthUser, COOKIE_NAME } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function POST() {
  const user = await getAuthUser();
  if (user) {
    await prisma.session
      .update({ where: { id: user.sessionId }, data: { isActive: false } })
      .catch(() => null);
  }
  const res = Response.json({ ok: true });
  res.headers.set("Set-Cookie", `${COOKIE_NAME}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0`);
  return res;
}
