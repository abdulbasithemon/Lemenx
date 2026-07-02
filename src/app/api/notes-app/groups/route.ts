import { NextRequest, NextResponse } from "next/server";
import { createGroup, reorderGroups } from "@/lib/notesStore";

export const dynamic = "force-dynamic";

/** POST /api/notes-app/groups — create a section. Body: { categoryId, title } */
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  if (typeof body.title !== "string" || typeof body.categoryId !== "string") {
    return NextResponse.json({ error: "categoryId and title are required" }, { status: 400 });
  }
  return NextResponse.json(createGroup(body.categoryId, body.title), { status: 201 });
}

/** PATCH /api/notes-app/groups — bulk reorder/move. Body: { moves: [{id, categoryId, order}] } */
export async function PATCH(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  if (!Array.isArray(body.moves)) {
    return NextResponse.json({ error: "moves is required" }, { status: 400 });
  }
  reorderGroups(body.moves);
  return NextResponse.json({ ok: true });
}
