import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { getNote, newShareToken, setPublishState, toDTO } from "@/lib/notesStore";

export const dynamic = "force-dynamic";

/**
 * POST /api/notes-app/notes/:id/publish
 * Body: { action: "publish" | "unpublish" | "setPassword" | "removePassword", password? }
 *
 * - publish: generates a fresh share token every time (re-publishing after an
 *   unpublish issues a new URL, so revoked links can never come back to life).
 * - unpublish: clears the token immediately — old links 404 from that moment.
 * - setPassword: stores only a bcrypt hash, never the plaintext.
 */
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const note = getNote(params.id);
  if (!note) return NextResponse.json({ error: "not found" }, { status: 404 });

  const body = await req.json().catch(() => ({}));
  const action = body.action as string;

  switch (action) {
    case "publish": {
      const updated = setPublishState(params.id, {
        isPublished: true,
        shareToken: newShareToken(),
        publishedAt: new Date().toISOString(),
      });
      return NextResponse.json(toDTO(updated!));
    }
    case "unpublish": {
      const updated = setPublishState(params.id, {
        isPublished: false,
        shareToken: undefined,
        publishedAt: undefined,
      });
      return NextResponse.json(toDTO(updated!));
    }
    case "setPassword": {
      if (typeof body.password !== "string" || body.password.length < 4) {
        return NextResponse.json({ error: "Password must be at least 4 characters" }, { status: 400 });
      }
      const updated = setPublishState(params.id, {
        passwordHash: bcrypt.hashSync(body.password, 10),
      });
      return NextResponse.json(toDTO(updated!));
    }
    case "removePassword": {
      const updated = setPublishState(params.id, { passwordHash: undefined });
      return NextResponse.json(toDTO(updated!));
    }
    default:
      return NextResponse.json({ error: "unknown action" }, { status: 400 });
  }
}
