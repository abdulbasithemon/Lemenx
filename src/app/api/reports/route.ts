import { NextRequest } from "next/server";
import { requireRole, errorResponse } from "@/lib/auth";
import { buildReport } from "@/lib/report";

/** GET /api/reports?from=YYYY-MM-DD&to=YYYY-MM-DD — Manager and Super Admin. */
export async function GET(req: NextRequest) {
  try {
    await requireRole("super_admin", "manager");
    const from = req.nextUrl.searchParams.get("from");
    const to = req.nextUrl.searchParams.get("to");
    if (!from || !to) return Response.json({ error: "from and to dates are required." }, { status: 400 });
    const rows = await buildReport(from, to);
    return Response.json({ rows });
  } catch (e) {
    return errorResponse(e);
  }
}
