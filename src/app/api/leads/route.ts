import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { requireRole, errorResponse } from "@/lib/auth";
import { getOrBuildMenuState, CATEGORIES, Category } from "@/lib/distribution";

/**
 * GET /api/leads?category=elite_special|call_sheet
 * Agent/Manager: their rolling-window batch for that menu.
 * Super Admin: full paginated list (?page=&search=).
 */
export async function GET(req: NextRequest) {
  try {
    const user = await requireRole();
    const category = req.nextUrl.searchParams.get("category") as Category;
    if (!CATEGORIES.includes(category)) {
      return Response.json({ error: "Invalid category" }, { status: 400 });
    }

    if (user.role === "super_admin") {
      const page = Math.max(1, parseInt(req.nextUrl.searchParams.get("page") || "1", 10));
      const search = req.nextUrl.searchParams.get("search") || "";
      const where = {
        category,
        ...(search
          ? { OR: [{ customerName: { contains: search } }, { phone: { contains: search } }] }
          : {}),
      };
      const [leads, total] = await Promise.all([
        prisma.lead.findMany({
          where,
          orderBy: { id: "desc" },
          skip: (page - 1) * 50,
          take: 50,
        }),
        prisma.lead.count({ where }),
      ]);
      return Response.json({ leads, total, page, pageSize: 50, mode: "admin" });
    }

    const state = await getOrBuildMenuState(user.id, user.sessionId, category);
    const rows = await prisma.lead.findMany({ where: { id: { in: state.visibleIds } } });
    const byId = new Map(rows.map((l) => [l.id, l]));
    const leads = state.visibleIds.map((id) => byId.get(id)).filter(Boolean);
    return Response.json({
      leads,
      mode: "window",
      progress: { newTouches: state.newTouches, trigger: 8 },
    });
  } catch (e) {
    return errorResponse(e);
  }
}
