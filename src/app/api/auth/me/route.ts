import { getAuthUser } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET() {
  const user = await getAuthUser();
  if (!user) return Response.json({ error: "Not authenticated" }, { status: 401 });
  const dbUser = await prisma.user.findUnique({
    where: { id: user.id },
    select: { id: true, name: true, email: true, role: true, whatsappNumber: true, dob: true },
  });
  return Response.json({ user: dbUser });
}
