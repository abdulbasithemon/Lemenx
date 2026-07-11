import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { requireRole, errorResponse } from "@/lib/auth";

const MAX_LEAVE_PER_MONTH = 3;
const LIMIT_ERROR_BN = "আপনি ইতিমধ্যে ৩ দিন ছুটি নিয়েছেন এই মাসে আর সম্ভব নয়";

function isFriday(dateStr: string): boolean {
  return new Date(dateStr + "T00:00:00Z").getUTCDay() === 5;
}

function todayStr(): string {
  return new Date().toISOString().slice(0, 10);
}

/** GET — the caller's own leave applications. */
export async function GET() {
  try {
    const user = await requireRole("manager", "agent");
    const leaves = await prisma.leaveApplication.findMany({
      where: { userId: user.id },
      include: { decidedBy: { select: { name: true } } },
      orderBy: { createdAt: "desc" },
    });
    return Response.json({ leaves });
  } catch (e) {
    return errorResponse(e);
  }
}

/** POST { leaveDate: "YYYY-MM-DD", reason } — apply for a single day. */
export async function POST(req: NextRequest) {
  try {
    const user = await requireRole("manager", "agent");
    const { leaveDate, reason } = await req.json();

    if (!leaveDate || !/^\d{4}-\d{2}-\d{2}$/.test(leaveDate)) {
      return Response.json({ error: "Select a valid date." }, { status: 400 });
    }
    if (!reason || !reason.trim()) {
      return Response.json({ error: "Reason / note is required." }, { status: 400 });
    }
    if (leaveDate < todayStr()) {
      return Response.json({ error: "Cannot apply for a past date." }, { status: 400 });
    }
    if (isFriday(leaveDate)) {
      return Response.json({ error: "Fridays cannot be selected for leave." }, { status: 400 });
    }

    const duplicate = await prisma.leaveApplication.findFirst({
      where: { userId: user.id, leaveDate, status: { in: ["pending", "approved"] } },
    });
    if (duplicate) {
      return Response.json({ error: "You already have an application for this date." }, { status: 409 });
    }

    // Max 3 leave days per calendar month (pending + approved count toward it).
    const month = leaveDate.slice(0, 7);
    const usedThisMonth = await prisma.leaveApplication.count({
      where: {
        userId: user.id,
        leaveDate: { startsWith: month },
        status: { in: ["pending", "approved"] },
      },
    });
    if (usedThisMonth >= MAX_LEAVE_PER_MONTH) {
      return Response.json({ error: LIMIT_ERROR_BN }, { status: 400 });
    }

    const leave = await prisma.leaveApplication.create({
      data: { userId: user.id, leaveDate, reason: reason.trim() },
    });
    return Response.json({ leave }, { status: 201 });
  } catch (e) {
    return errorResponse(e);
  }
}
