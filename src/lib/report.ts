import { prisma } from "./db";

export interface ReportRow {
  userId: number;
  userName: string;
  role: string;
  totalTouched: number;
  byStatus: Record<string, number>;
  byCategory: Record<string, number>;
}

/** Per-user touched-lead summary for leads first touched within [from, to]. */
export async function buildReport(from: string, to: string): Promise<ReportRow[]> {
  const fromDate = new Date(from + "T00:00:00Z");
  const toDate = new Date(to + "T23:59:59.999Z");

  const leads = await prisma.lead.findMany({
    where: { touchedAt: { gte: fromDate, lte: toDate }, touchedById: { not: null } },
    select: { touchedById: true, status: true, category: true },
  });
  const users = await prisma.user.findMany({ select: { id: true, name: true, role: true } });
  const userById = new Map(users.map((u) => [u.id, u]));

  const rows = new Map<number, ReportRow>();
  for (const lead of leads) {
    const uid = lead.touchedById!;
    let row = rows.get(uid);
    if (!row) {
      const u = userById.get(uid);
      row = {
        userId: uid,
        userName: u?.name ?? `User #${uid}`,
        role: u?.role ?? "unknown",
        totalTouched: 0,
        byStatus: {},
        byCategory: {},
      };
      rows.set(uid, row);
    }
    row.totalTouched++;
    row.byStatus[lead.status] = (row.byStatus[lead.status] || 0) + 1;
    row.byCategory[lead.category] = (row.byCategory[lead.category] || 0) + 1;
  }
  return [...rows.values()].sort((a, b) => b.totalTouched - a.totalTouched);
}

export function csvEscape(value: unknown): string {
  const s = value == null ? "" : String(value);
  if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}
