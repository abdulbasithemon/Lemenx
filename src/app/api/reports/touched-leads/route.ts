import { prisma } from "@/lib/db";
import { requireRole, errorResponse } from "@/lib/auth";
import { csvEscape } from "@/lib/report";

/**
 * GET — Super Admin only: every touched lead as CSV, ready to be cleaned
 * externally and re-uploaded as fresh.
 */
export async function GET() {
  try {
    await requireRole("super_admin");
    const leads = await prisma.lead.findMany({
      where: { status: { not: "fresh" } },
      orderBy: { touchedAt: "desc" },
    });
    const users = await prisma.user.findMany({ select: { id: true, name: true } });
    const nameById = new Map(users.map((u) => [u.id, u.name]));

    const header = [
      "Customer Name",
      "Phone Number",
      "Address",
      "OG Report",
      "Category",
      "Status",
      "Agent Note",
      "Touched By",
      "Touched At",
    ];
    const lines = [header.map(csvEscape).join(",")];
    for (const lead of leads) {
      lines.push(
        [
          lead.customerName,
          lead.phone,
          lead.address ?? "",
          `Total order - ${lead.totalOrders}, Delivered - ${lead.delivered}, Returned - ${lead.returned}`,
          lead.category === "elite_special" ? "Elite Special" : "Call Sheet",
          lead.status,
          lead.agentNote ?? "",
          lead.touchedById ? nameById.get(lead.touchedById) ?? "" : "",
          lead.touchedAt ? lead.touchedAt.toISOString() : "",
        ]
          .map(csvEscape)
          .join(",")
      );
    }

    return new Response("﻿" + lines.join("\n") + "\n", {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="touched_leads_${new Date().toISOString().slice(0, 10)}.csv"`,
      },
    });
  } catch (e) {
    return errorResponse(e);
  }
}
