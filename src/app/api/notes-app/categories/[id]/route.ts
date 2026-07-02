import { NextRequest, NextResponse } from "next/server";
import { deleteCategory, updateCategory } from "@/lib/notesStore";

export const dynamic = "force-dynamic";

/** PATCH /api/notes-app/categories/:id — rename / set order. */
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const body = await req.json().catch(() => ({}));
  const c = updateCategory(params.id, { title: body.title, order: body.order });
  if (!c) return NextResponse.json({ error: "not found" }, { status: 404 });
  return NextResponse.json(c);
}

/** DELETE /api/notes-app/categories/:id — cascades to groups and notes. */
export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  deleteCategory(params.id);
  return NextResponse.json({ ok: true });
}
