import { NextRequest } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";
import { requireRole, errorResponse } from "@/lib/auth";

/** Super Admin sees everyone; Manager sees Agents only. */
export async function GET() {
  try {
    const user = await requireRole("super_admin", "manager");
    const where = user.role === "manager" ? { role: "agent" } : { role: { in: ["manager", "agent"] } };
    const users = await prisma.user.findMany({
      where,
      select: {
        id: true,
        name: true,
        email: true,
        dob: true,
        role: true,
        status: true,
        whatsappNumber: true,
        createdAt: true,
      },
      orderBy: { createdAt: "desc" },
    });
    return Response.json({ users });
  } catch (e) {
    return errorResponse(e);
  }
}

export async function POST(req: NextRequest) {
  try {
    const actor = await requireRole("super_admin", "manager");
    const { name, email, dob, password, role, whatsappNumber } = await req.json();

    if (!name || !email || !dob || !password || !role) {
      return Response.json({ error: "Name, email, DOB, password and role are required." }, { status: 400 });
    }
    if (!["manager", "agent"].includes(role)) {
      return Response.json({ error: "Role must be manager or agent." }, { status: 400 });
    }
    // Managers may only create Agents.
    if (actor.role === "manager" && role !== "agent") {
      return Response.json({ error: "Managers can only create Agent users." }, { status: 403 });
    }
    if (password.length < 6) {
      return Response.json({ error: "Password must be at least 6 characters." }, { status: 400 });
    }

    const exists = await prisma.user.findUnique({ where: { email: String(email).toLowerCase() } });
    if (exists) return Response.json({ error: "A user with this email already exists." }, { status: 409 });

    const created = await prisma.user.create({
      data: {
        name,
        email: String(email).toLowerCase(),
        dob,
        passwordHash: bcrypt.hashSync(password, 10),
        role,
        whatsappNumber: whatsappNumber || null,
        createdById: actor.id,
      },
      select: { id: true, name: true, email: true, role: true, status: true },
    });
    return Response.json({ user: created }, { status: 201 });
  } catch (e) {
    return errorResponse(e);
  }
}
