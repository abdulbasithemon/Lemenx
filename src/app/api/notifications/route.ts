import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { requireRole, errorResponse } from "@/lib/auth";

export async function GET() {
  try {
    const user = await requireRole();
    const [notifications, unread] = await Promise.all([
      prisma.notification.findMany({
        where: { userId: user.id },
        orderBy: { createdAt: "desc" },
        take: 30,
      }),
      prisma.notification.count({ where: { userId: user.id, isRead: false } }),
    ]);
    return Response.json({ notifications, unread });
  } catch (e) {
    return errorResponse(e);
  }
}

/** POST — mark all of the caller's notifications read. */
export async function POST(_req: NextRequest) {
  try {
    const user = await requireRole();
    await prisma.notification.updateMany({
      where: { userId: user.id, isRead: false },
      data: { isRead: true },
    });
    return Response.json({ ok: true });
  } catch (e) {
    return errorResponse(e);
  }
}
