import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { requireRole, errorResponse } from "@/lib/auth";
import { buildReport, csvEscape } from "@/lib/report";

/** GET /api/reports/export?from=&to= — Super Admin only: report as CSV. */
export async function GET(req: NextRequest) {
  try {
    await requireRole("super_admin");
    const from = req.nextUrl.searchParams.get("from");
    const to = req.nextUrl.searchParams.get("to");
    if (!from || !to) return Response.json({ error: "from and to dates are required." }, { status: 400 });

    const rows = await buildReport(from, to);
    const statuses = await prisma.status.findMany({ orderBy: { id: "asc" } });
    const statusLabels = statuses.map((s) => s.label);

    const header = [
      "User",
      "Role",
      "Total Touched",
      ...statusLabels,
      "Elite Special",
      "Call Sheet",
    ];
    const lines = [header.map(csvEscape).join(",")];
    for (const row of rows) {
      lines.push(
        [
          row.userName,
          row.role,
          row.totalTouched,
          ...statusLabels.map((l) => row.byStatus[l] || 0),
          row.byCategory["elite_special"] || 0,
          row.byCategory["call_sheet"] || 0,
        ]
          .map(csvEscape)
          .join(",")
      );
    }

    return new Response("﻿" + lines.join("\n") + "\n", {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="report_${from}_${to}.csv"`,
      },
    });
  } catch (e) {
    return errorResponse(e);
  }
}
