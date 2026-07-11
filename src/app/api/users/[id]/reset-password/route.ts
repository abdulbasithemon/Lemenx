import { NextRequest } from "next/server";
import bcrypt from "bcryptjs";
import { randomBytes } from "crypto";
import { prisma } from "@/lib/db";
import { requireRole, errorResponse, AuthError } from "@/lib/auth";

/** Resets the target user's password; the new password is shown once on-screen. */
export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const actor = await requireRole("super_admin", "manager");
    const { id } = await params;
    const target = await prisma.user.findUnique({ where: { id: parseInt(id, 10) } });
    if (!target) throw new AuthError(404, "User not found");
    if (target.role === "super_admin") throw new AuthError(403, "Cannot reset the Super Admin password here.");
    if (actor.role === "manager" && target.role !== "agent") {
      throw new AuthError(403, "Managers can only reset Agent passwords.");
    }

    const newPassword = randomBytes(4).toString("hex"); // 8-char random password
    await prisma.user.update({
      where: { id: target.id },
      data: { passwordHash: bcrypt.hashSync(newPassword, 10) },
    });
    return Response.json({ newPassword });
  } catch (e) {
    return errorResponse(e);
  }
}
