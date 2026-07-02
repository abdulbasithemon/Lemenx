import { NextRequest, NextResponse } from "next/server";
import { deleteGroup, updateGroup } from "@/lib/notesStore";

export const dynamic = "force-dynamic";

/** PATCH /api/notes-app/groups/:id — rename / set order. */
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const body = await req.json().catch(() => ({}));
  const g = updateGroup(params.id, { title: body.title, order: body.order });
  if (!g) return NextResponse.json({ error: "not found" }, { status: 404 });
  return NextResponse.json(g);
}

/** DELETE /api/notes-app/groups/:id — deletes the group and its notes. */
export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  deleteGroup(params.id);
  return NextResponse.json({ ok: true });
}
