import { NextRequest, NextResponse } from "next/server";
import { deleteNote, getNote, toDTO, updateNote } from "@/lib/notesStore";

export const dynamic = "force-dynamic";

/** GET /api/notes-app/notes/:id — full note with blocks. */
export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const note = getNote(params.id);
  if (!note) return NextResponse.json({ error: "not found" }, { status: 404 });
  return NextResponse.json(toDTO(note));
}

/** PATCH /api/notes-app/notes/:id — save title/icon/blocks/order/group. */
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const body = await req.json().catch(() => ({}));
  const note = updateNote(params.id, {
    title: typeof body.title === "string" ? body.title : undefined,
    icon: typeof body.icon === "string" || body.icon === null ? body.icon ?? undefined : undefined,
    blocks: Array.isArray(body.blocks) ? body.blocks : undefined,
    order: typeof body.order === "number" ? body.order : undefined,
    groupId: typeof body.groupId === "string" ? body.groupId : undefined,
  });
  if (!note) return NextResponse.json({ error: "not found" }, { status: 404 });
  return NextResponse.json(toDTO(note));
}

/** DELETE /api/notes-app/notes/:id */
export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  deleteNote(params.id);
  return NextResponse.json({ ok: true });
}
