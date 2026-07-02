import { NextRequest, NextResponse } from "next/server";
import { createCategory, reorderCategories } from "@/lib/notesStore";

export const dynamic = "force-dynamic";

/** POST /api/notes-app/categories — create. Body: { title } */
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  if (typeof body.title !== "string") {
    return NextResponse.json({ error: "title is required" }, { status: 400 });
  }
  return NextResponse.json(createCategory(body.title), { status: 201 });
}

/** PATCH /api/notes-app/categories — reorder. Body: { orderedIds: string[] } */
export async function PATCH(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  if (!Array.isArray(body.orderedIds)) {
    return NextResponse.json({ error: "orderedIds is required" }, { status: 400 });
  }
  reorderCategories(body.orderedIds);
  return NextResponse.json({ ok: true });
}
