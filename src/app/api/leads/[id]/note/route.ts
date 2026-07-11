import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { requireRole, errorResponse, AuthError } from "@/lib/auth";

/** POST /api/leads/:id/note { note } — optional per-lead personal note. */
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireRole();
    const { id } = await params;
    const { note } = await req.json();

    const lead = await prisma.lead.findUnique({ where: { id: parseInt(id, 10) } });
    if (!lead) throw new AuthError(404, "Lead not found");
    if (user.role !== "super_admin" && lead.assignedToId !== user.id) {
      throw new AuthError(403, "This lead is not assigned to you.");
    }

    await prisma.lead.update({
      where: { id: lead.id },
      data: { agentNote: note ? String(note).slice(0, 500) : null },
    });
    return Response.json({ ok: true });
  } catch (e) {
    return errorResponse(e);
  }
}
