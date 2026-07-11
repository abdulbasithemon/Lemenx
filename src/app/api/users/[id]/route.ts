import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { requireRole, errorResponse, AuthError, AuthUser } from "@/lib/auth";

async function getTarget(actor: AuthUser, idParam: string) {
  const id = parseInt(idParam, 10);
  const target = await prisma.user.findUnique({ where: { id } });
  if (!target) throw new AuthError(404, "User not found");
  if (target.role === "super_admin") throw new AuthError(403, "Super Admin account cannot be modified.");
  if (actor.role === "manager" && target.role !== "agent") {
    throw new AuthError(403, "Managers can only manage Agent users.");
  }
  return target;
}

/** PATCH { action: "pause" | "unpause" } */
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const actor = await requireRole("super_admin", "manager");
    const { id } = await params;
    const target = await getTarget(actor, id);
    const { action } = await req.json();

    if (action === "pause" || action === "unpause") {
      const status = action === "pause" ? "paused" : "active";
      await prisma.user.update({ where: { id: target.id }, data: { status } });
      if (status === "paused") {
        await prisma.session.updateMany({ where: { userId: target.id }, data: { isActive: false } });
      }
      return Response.json({ ok: true, status });
    }
    return Response.json({ error: "Unknown action" }, { status: 400 });
  } catch (e) {
    return errorResponse(e);
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const actor = await requireRole("super_admin", "manager");
    const { id } = await params;
    const target = await getTarget(actor, id);

    // Release the user's untouched assigned leads back to the pool first.
    await prisma.lead.updateMany({
      where: { assignedToId: target.id, status: "fresh" },
      data: { assignedToId: null },
    });
    await prisma.user.delete({ where: { id: target.id } });
    return Response.json({ ok: true });
  } catch (e) {
    return errorResponse(e);
  }
}
