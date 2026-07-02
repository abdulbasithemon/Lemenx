import { NextRequest, NextResponse } from "next/server";
import { createGroup, reorderGroups } from "@/lib/notesStore";

export const dynamic = "force-dynamic";

/** POST /api/notes-app/groups — create a group. Body: { title } */
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  if (typeof body.title !== "string") {
    return NextResponse.json({ error: "title is required" }, { status: 400 });
  }
  return NextResponse.json(createGroup(body.title), { status: 201 });
}

/** PATCH /api/notes-app/groups — reorder. Body: { orderedIds: string[] } */
export async function PATCH(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  if (!Array.isArray(body.orderedIds)) {
    return NextResponse.json({ error: "orderedIds is required" }, { status: 400 });
  }
  reorderGroups(body.orderedIds);
  return NextResponse.json({ ok: true });
}
