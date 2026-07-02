import { NextResponse } from "next/server";
import { getTree } from "@/lib/notesStore";

export const dynamic = "force-dynamic";

/** GET /api/notes-app — full sidebar tree (groups + note metadata). */
export async function GET() {
  return NextResponse.json(getTree());
}
