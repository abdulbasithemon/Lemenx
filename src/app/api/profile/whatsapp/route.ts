import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { requireRole, errorResponse } from "@/lib/auth";

/** Any logged-in user can update their own WhatsApp number. */
export async function POST(req: NextRequest) {
  try {
    const user = await requireRole();
    const { whatsappNumber } = await req.json();
    if (!whatsappNumber || !/^\+?[\d\s-]{8,20}$/.test(whatsappNumber)) {
      return Response.json(
        { error: "Enter a valid WhatsApp number including country code, e.g. +8801XXXXXXXXX" },
        { status: 400 }
      );
    }
    await prisma.user.update({
      where: { id: user.id },
      data: { whatsappNumber: whatsappNumber.replace(/[\s-]/g, "") },
    });
    return Response.json({ ok: true });
  } catch (e) {
    return errorResponse(e);
  }
}
