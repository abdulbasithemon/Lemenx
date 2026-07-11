import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { requireRole, errorResponse, AuthError } from "@/lib/auth";
import { registerTouch, Category } from "@/lib/distribution";

/**
 * POST /api/leads/:id/status { status }
 * First change away from "fresh" marks the lead touched and feeds the
 * 10 -> 11 rolling window. Later changes just update the label (no lock).
 */
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireRole();
    const { id } = await params;
    const { status } = await req.json();

    const lead = await prisma.lead.findUnique({ where: { id: parseInt(id, 10) } });
    if (!lead) throw new AuthError(404, "Lead not found");

    if (user.role !== "super_admin" && lead.assignedToId !== user.id) {
      throw new AuthError(403, "This lead is not assigned to you.");
    }

    const valid = await prisma.status.findFirst({ where: { label: status, isActive: true } });
    if (!valid) return Response.json({ error: "Unknown status." }, { status: 400 });

    const firstTouch = lead.status === "fresh";
    await prisma.lead.update({
      where: { id: lead.id },
      data: {
        status,
        ...(firstTouch
          ? { touchedAt: new Date(), touchedById: user.id, assignedToId: lead.assignedToId ?? user.id }
          : {}),
      },
    });
    await prisma.leadStatusHistory.create({
      data: { leadId: lead.id, oldStatus: lead.status, newStatus: status, changedById: user.id },
    });

    if (firstTouch && user.role !== "super_admin") {
      await registerTouch(user.id, user.sessionId, lead.category as Category, lead.id);
    }

    return Response.json({ ok: true, firstTouch });
  } catch (e) {
    return errorResponse(e);
  }
}
