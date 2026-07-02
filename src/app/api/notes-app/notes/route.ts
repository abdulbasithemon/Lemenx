import { NextRequest, NextResponse } from "next/server";
import { createNote, reorderNotes, toDTO } from "@/lib/notesStore";

export const dynamic = "force-dynamic";

/** POST /api/notes-app/notes — create a note. Body: { groupId, title? } */
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  if (typeof body.groupId !== "string") {
    return NextResponse.json({ error: "groupId is required" }, { status: 400 });
  }
  const note = createNote(body.groupId, typeof body.title === "string" ? body.title : undefined);
  return NextResponse.json(toDTO(note), { status: 201 });
}

/** PATCH /api/notes-app/notes — bulk reorder/move. Body: { moves: [{id, groupId, order}] } */
export async function PATCH(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  if (!Array.isArray(body.moves)) {
    return NextResponse.json({ error: "moves is required" }, { status: 400 });
  }
  reorderNotes(body.moves);
  return NextResponse.json({ ok: true });
}
