import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { getNoteByToken } from "@/lib/notesStore";
import type { NoteDoc } from "@/types/notes";

export const dynamic = "force-dynamic";

/** Public payload: only what a viewer needs, never the hash or group info. */
function publicView(note: NoteDoc) {
  return {
    title: note.title,
    icon: note.icon,
    blocks: note.blocks,
    publishedAt: note.publishedAt,
    updatedAt: note.updatedAt,
  };
}

/**
 * GET /api/share/:token
 * → 404 if the token is invalid or the note was unpublished.
 * → { requiresPassword: true } if password-protected.
 * → { note } if open.
 */
export async function GET(_req: NextRequest, { params }: { params: { token: string } }) {
  const note = getNoteByToken(params.token);
  if (!note) return NextResponse.json({ error: "not found" }, { status: 404 });
  if (note.passwordHash) return NextResponse.json({ requiresPassword: true });
  return NextResponse.json({ note: publicView(note) });
}

/**
 * POST /api/share/:token — verify password. Body: { password }
 * → { note } on success, 401 on wrong password.
 */
export async function POST(req: NextRequest, { params }: { params: { token: string } }) {
  const note = getNoteByToken(params.token);
  if (!note) return NextResponse.json({ error: "not found" }, { status: 404 });

  const body = await req.json().catch(() => ({}));
  const password = typeof body.password === "string" ? body.password : "";

  if (note.passwordHash && !bcrypt.compareSync(password, note.passwordHash)) {
    return NextResponse.json({ error: "Incorrect password" }, { status: 401 });
  }
  return NextResponse.json({ note: publicView(note) });
}
