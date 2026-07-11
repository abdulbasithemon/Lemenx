import { NextRequest } from "next/server";
import Papa from "papaparse";
import * as XLSX from "xlsx";
import { randomUUID } from "crypto";
import { prisma } from "@/lib/db";
import { requireRole, errorResponse } from "@/lib/auth";
import { parseOgReport } from "@/lib/og-parser";
import { CATEGORIES, Category, topUpActiveUsers } from "@/lib/distribution";

interface Row {
  customerName: string;
  phone: string;
  address: string;
  ogReport: string;
}

function normalizeHeader(h: string): string {
  return h.toLowerCase().replace(/[^a-z]/g, "");
}

const HEADER_MAP: Record<string, keyof Row> = {
  customername: "customerName",
  name: "customerName",
  phonenumber: "phone",
  phone: "phone",
  mobile: "phone",
  address: "address",
  ogreport: "ogReport",
  orderreport: "ogReport",
  report: "ogReport",
};

function mapRecord(record: Record<string, unknown>): Row {
  const row: Row = { customerName: "", phone: "", address: "", ogReport: "" };
  for (const [key, value] of Object.entries(record)) {
    const field = HEADER_MAP[normalizeHeader(key)];
    if (field && value != null) row[field] = String(value).trim();
  }
  return row;
}

/**
 * POST /api/leads/upload — multipart form: file (CSV/XLSX) + category.
 * New numbers become fresh leads; already-touched numbers in the same category
 * are reset to fresh (re-upload flow) with their history preserved in the
 * reupload log. Untouched duplicates are skipped.
 */
export async function POST(req: NextRequest) {
  try {
    const user = await requireRole("super_admin");
    const form = await req.formData();
    const file = form.get("file") as File | null;
    const category = form.get("category") as Category;

    if (!file) return Response.json({ error: "No file provided." }, { status: 400 });
    if (!CATEGORIES.includes(category)) {
      return Response.json({ error: "Select a category: Elite Special or Call Sheet." }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    let records: Record<string, unknown>[] = [];

    if (file.name.toLowerCase().endsWith(".csv")) {
      const parsed = Papa.parse<Record<string, unknown>>(buffer.toString("utf-8"), {
        header: true,
        skipEmptyLines: true,
      });
      records = parsed.data;
    } else {
      const wb = XLSX.read(buffer, { type: "buffer" });
      const sheet = wb.Sheets[wb.SheetNames[0]];
      records = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: "" });
    }

    if (!records.length) {
      return Response.json({ error: "The file contains no data rows." }, { status: 400 });
    }

    const batchId = randomUUID();
    let created = 0;
    let reactivated = 0;
    let skipped = 0;

    for (const record of records) {
      const row = mapRecord(record);
      if (!row.customerName && !row.phone) {
        skipped++;
        continue;
      }
      const og = parseOgReport(row.ogReport);

      const existing = row.phone
        ? await prisma.lead.findFirst({ where: { phone: row.phone, category } })
        : null;

      if (existing) {
        if (existing.status === "fresh") {
          skipped++; // still untouched in the pool — avoid duplicates
          continue;
        }
        // Re-upload of a touched lead: preserve history, reset to fresh.
        await prisma.leadReuploadLog.create({
          data: {
            leadId: existing.id,
            previousStatus: existing.status,
            previousTouchedBy: existing.touchedById,
            reuploadedById: user.id,
          },
        });
        await prisma.lead.update({
          where: { id: existing.id },
          data: {
            status: "fresh",
            assignedToId: null,
            touchedAt: null,
            touchedById: null,
            agentNote: null,
            uploadBatchId: batchId,
            customerName: row.customerName || existing.customerName,
            address: row.address || existing.address,
            totalOrders: og.totalOrders,
            delivered: og.delivered,
            returned: og.returned,
          },
        });
        reactivated++;
        continue;
      }

      await prisma.lead.create({
        data: {
          customerName: row.customerName || "Unknown",
          phone: row.phone,
          address: row.address || null,
          totalOrders: og.totalOrders,
          delivered: og.delivered,
          returned: og.returned,
          category,
          uploadedById: user.id,
          uploadBatchId: batchId,
        },
      });
      created++;
    }

    // Top active users' windows back up toward 10 with the new supply.
    await topUpActiveUsers(category);

    return Response.json({ created, reactivated, skipped, batchId });
  } catch (e) {
    return errorResponse(e);
  }
}
