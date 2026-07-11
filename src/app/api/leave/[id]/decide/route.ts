import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { requireRole, errorResponse, AuthError } from "@/lib/auth";
import { sendWhatsAppMessage } from "@/lib/whatsapp";

/**
 * POST /api/leave/:id/decide { decision: "approved" | "declined", note? }
 * Agent leave: Manager or Super Admin. Manager leave: Super Admin only.
 * Decisions can be changed later. Applicant gets a dashboard notification
 * + WhatsApp message.
 */
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const actor = await requireRole("super_admin", "manager");
    const { id } = await params;
    const { decision, note } = await req.json();

    if (!["approved", "declined"].includes(decision)) {
      return Response.json({ error: "Decision must be approved or declined." }, { status: 400 });
    }

    const leave = await prisma.leaveApplication.findUnique({
      where: { id: parseInt(id, 10) },
      include: { user: true },
    });
    if (!leave) throw new AuthError(404, "Leave application not found");

    if (leave.userId === actor.id) {
      throw new AuthError(403, "You cannot decide your own leave application.");
    }
    if (leave.user.role === "manager" && actor.role !== "super_admin") {
      throw new AuthError(403, "Only Super Admin can decide a Manager's leave.");
    }
    if (leave.user.role === "super_admin") {
      throw new AuthError(403, "Invalid target.");
    }

    await prisma.leaveApplication.update({
      where: { id: leave.id },
      data: {
        status: decision,
        decidedById: actor.id,
        decisionNote: note?.trim() || null,
        decidedAt: new Date(),
      },
    });

    const verb = decision === "approved" ? "APPROVED" : "DECLINED";
    const noteText = note?.trim()
      ? (decision === "approved" ? ` Note: ${note.trim()}` : ` Reason: ${note.trim()}`)
      : "";

    await prisma.notification.create({
      data: {
        userId: leave.userId,
        type: decision === "approved" ? "leave_approved" : "leave_declined",
        message: `Your leave request for ${leave.leaveDate} has been ${verb} by ${actor.name}.${noteText}`,
      },
    });

    const waMessage = `Assalamu Alaikum ${leave.user.name}, your leave request for ${leave.leaveDate} has been ${verb} by ${actor.name}.${noteText}`;
    await sendWhatsAppMessage(leave.user.whatsappNumber, waMessage, leave.userId);

    return Response.json({ ok: true });
  } catch (e) {
    return errorResponse(e);
  }
}
