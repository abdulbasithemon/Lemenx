import { prisma } from "@/lib/db";
import { requireRole, errorResponse } from "@/lib/auth";

/**
 * GET — leave applications the caller may decide on.
 * Manager: Agents' applications. Super Admin: Agents' + Managers'.
 * Includes decided ones so a decision can be changed later.
 */
export async function GET() {
  try {
    const user = await requireRole("super_admin", "manager");
    const roles = user.role === "super_admin" ? ["agent", "manager"] : ["agent"];
    const leaves = await prisma.leaveApplication.findMany({
      where: { user: { role: { in: roles } } },
      include: {
        user: { select: { id: true, name: true, role: true, email: true } },
        decidedBy: { select: { name: true } },
      },
      orderBy: [{ status: "asc" }, { createdAt: "desc" }],
      take: 200,
    });
    return Response.json({ leaves });
  } catch (e) {
    return errorResponse(e);
  }
}
