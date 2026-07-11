import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { requireRole, errorResponse, AuthError } from "@/lib/auth";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireRole("super_admin");
    const { id } = await params;
    const status = await prisma.status.findUnique({ where: { id: parseInt(id, 10) } });
    if (!status) throw new AuthError(404, "Status not found");

    const { label, color } = await req.json();
    const oldLabel = status.label;
    const updated = await prisma.status.update({
      where: { id: status.id },
      data: {
        ...(label && label.trim() ? { label: label.trim() } : {}),
        ...(color ? { color } : {}),
      },
    });
    // Keep leads consistent when a label is renamed.
    if (label && label.trim() && label.trim() !== oldLabel) {
      await prisma.lead.updateMany({ where: { status: oldLabel }, data: { status: label.trim() } });
    }
    return Response.json({ status: updated });
  } catch (e) {
    return errorResponse(e);
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireRole("super_admin");
    const { id } = await params;
    const status = await prisma.status.findUnique({ where: { id: parseInt(id, 10) } });
    if (!status) throw new AuthError(404, "Status not found");

    const inUse = await prisma.lead.count({ where: { status: status.label } });
    if (inUse > 0) {
      // Soft-disable so existing leads keep their label.
      await prisma.status.update({ where: { id: status.id }, data: { isActive: false } });
      return Response.json({ ok: true, softDeleted: true });
    }
    await prisma.status.delete({ where: { id: status.id } });
    return Response.json({ ok: true });
  } catch (e) {
    return errorResponse(e);
  }
}
