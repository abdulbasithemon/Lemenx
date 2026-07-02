import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { randomUUID } from "crypto";

export const dynamic = "force-dynamic";

const UPLOAD_DIR = path.join(process.cwd(), "data", "uploads");
const MAX_BYTES = 50 * 1024 * 1024; // 50 MB

/**
 * POST /api/notes-app/upload — multipart form with a "file" field.
 * Stores the file under data/uploads and returns { url, name }.
 * (Will move to cloud storage — S3/R2 — at deployment time.)
 */
export async function POST(req: NextRequest) {
  const form = await req.formData().catch(() => null);
  const file = form?.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "file field is required" }, { status: 400 });
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json({ error: "File is larger than 50 MB" }, { status: 413 });
  }

  // Keep the extension, randomize the name to avoid collisions/traversal.
  const ext = path.extname(file.name).toLowerCase().replace(/[^.\w]/g, "").slice(0, 10);
  const safeBase = path
    .basename(file.name, path.extname(file.name))
    .replace(/[^\w.-]+/g, "_")
    .slice(0, 60);
  const stored = `${randomUUID().slice(0, 8)}-${safeBase}${ext}`;

  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
  const buf = Buffer.from(await file.arrayBuffer());
  fs.writeFileSync(path.join(UPLOAD_DIR, stored), buf);

  return NextResponse.json({ url: `/api/uploads/${stored}`, name: file.name }, { status: 201 });
}
