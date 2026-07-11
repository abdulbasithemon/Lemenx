import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { requireRole, errorResponse } from "@/lib/auth";

/** All roles need the status list to render lead status dropdowns. */
export async function GET() {
  try {
    await requireRole();
    const statuses = await prisma.status.findMany({
      where: { isActive: true },
      orderBy: [{ isDefault: "desc" }, { id: "asc" }],
    });
    return Response.json({ statuses });
  } catch (e) {
    return errorResponse(e);
  }
}

/** Super Admin only: create a custom status label. */
export async function POST(req: NextRequest) {
  try {
    const user = await requireRole("super_admin");
    const { label, color } = await req.json();
    if (!label || !label.trim()) {
      return Response.json({ error: "Status label is required." }, { status: 400 });
    }
    if (label.trim().toLowerCase() === "fresh") {
      return Response.json({ error: '"Fresh" is reserved for untouched leads.' }, { status: 400 });
    }
    const exists = await prisma.status.findUnique({ where: { label: label.trim() } });
    if (exists) return Response.json({ error: "This status already exists." }, { status: 409 });

    const status = await prisma.status.create({
      data: { label: label.trim(), color: color || "#64748b", createdBy: user.id },
    });
    return Response.json({ status }, { status: 201 });
  } catch (e) {
    return errorResponse(e);
  }
}
