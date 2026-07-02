import fs from "fs";
import path from "path";
import { randomUUID, randomBytes } from "crypto";
import type { Block, NoteDoc, NoteDTO, NoteGroup } from "@/types/notes";

/**
 * File-based JSON store for the notes module.
 * Works with zero setup on localhost; swap for Prisma/Postgres later —
 * the API surface in /api/notes-app stays identical.
 */

const DATA_DIR = path.join(process.cwd(), "data");
const DB_PATH = path.join(DATA_DIR, "notes-app.json");

interface NotesDB {
  groups: NoteGroup[];
  notes: NoteDoc[];
}

export const uid = () => randomUUID().replace(/-/g, "").slice(0, 12);
export const newShareToken = () => randomBytes(18).toString("base64url");

function seed(): NotesDB {
  const now = new Date().toISOString();
  const groupId = uid();
  const noteId = uid();
  const b = (type: Block["type"], content: string, extra: Partial<Block> = {}): Block => ({
    id: uid(), type, content, indent: 0, ...extra,
  });
  return {
    groups: [{ id: groupId, title: "My Notes", order: 0, createdAt: now }],
    notes: [
      {
        id: noteId,
        groupId,
        title: "Welcome to Notes",
        icon: "👋",
        order: 0,
        createdAt: now,
        updatedAt: now,
        isPublished: false,
        blocks: [
          b("h1", "Welcome to your Notion-style notes"),
          b("text", "This editor is block-based. Click anywhere and start typing."),
          b("h2", "Things to try"),
          b("todo", "Type / on an empty line to open the block menu"),
          b("todo", "Press Tab to indent, Shift+Tab to outdent"),
          b("bulleted", "Drag blocks by the handle on the left to reorder"),
          b("toggle", "Click the arrow to collapse me", { collapsed: false }),
          b("text", "I'm hidden inside the toggle!", { indent: 1 }),
          b("callout", "Publish this note with the Share button — you can even add a password."),
          b("quote", "Ideas are cheap. Execution is everything."),
          b("divider", ""),
          b("text", "Create groups and notes from the sidebar on the left."),
        ],
      },
    ],
  };
}

function load(): NotesDB {
  try {
    const raw = fs.readFileSync(DB_PATH, "utf8");
    const db = JSON.parse(raw) as NotesDB;
    // Heal notes saved by an earlier bug that could drop the blocks array.
    for (const n of db.notes) {
      if (!Array.isArray(n.blocks) || n.blocks.length === 0) {
        n.blocks = [{ id: uid(), type: "text", content: "", indent: 0 }];
      }
    }
    return db;
  } catch {
    const db = seed();
    persist(db);
    return db;
  }
}

function persist(db: NotesDB) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
  const tmp = DB_PATH + ".tmp";
  fs.writeFileSync(tmp, JSON.stringify(db, null, 2), "utf8");
  fs.renameSync(tmp, DB_PATH);
}

/** Strip the password hash before anything leaves the server. */
export function toDTO(n: NoteDoc): NoteDTO {
  const { passwordHash, ...rest } = n;
  return { ...rest, hasPassword: Boolean(passwordHash) };
}

/* ── queries ─────────────────────────────────────────────── */

export function getTree() {
  const db = load();
  return {
    groups: [...db.groups].sort((a, z) => a.order - z.order),
    notes: db.notes
      .map(({ id, groupId, title, icon, order, isPublished }) => ({ id, groupId, title, icon, order, isPublished }))
      .sort((a, z) => a.order - z.order),
  };
}

export function getNote(id: string): NoteDoc | undefined {
  return load().notes.find((n) => n.id === id);
}

export function getNoteByToken(token: string): NoteDoc | undefined {
  if (!token) return undefined;
  return load().notes.find((n) => n.isPublished && n.shareToken === token);
}

/* ── mutations ───────────────────────────────────────────── */

export function createGroup(title: string): NoteGroup {
  const db = load();
  const group: NoteGroup = {
    id: uid(),
    title: title.trim() || "Untitled group",
    order: db.groups.length,
    createdAt: new Date().toISOString(),
  };
  db.groups.push(group);
  persist(db);
  return group;
}

export function updateGroup(id: string, patch: Partial<Pick<NoteGroup, "title" | "order">>) {
  const db = load();
  const g = db.groups.find((g) => g.id === id);
  if (!g) return undefined;
  if (patch.title !== undefined) g.title = patch.title.trim() || g.title;
  if (patch.order !== undefined) g.order = patch.order;
  persist(db);
  return g;
}

export function deleteGroup(id: string) {
  const db = load();
  db.groups = db.groups.filter((g) => g.id !== id);
  db.notes = db.notes.filter((n) => n.groupId !== id);
  persist(db);
}

export function reorderGroups(orderedIds: string[]) {
  const db = load();
  orderedIds.forEach((gid, i) => {
    const g = db.groups.find((g) => g.id === gid);
    if (g) g.order = i;
  });
  persist(db);
}

export function createNote(groupId: string, title = "Untitled"): NoteDoc {
  const db = load();
  const now = new Date().toISOString();
  const note: NoteDoc = {
    id: uid(),
    groupId,
    title,
    order: db.notes.filter((n) => n.groupId === groupId).length,
    blocks: [{ id: uid(), type: "text", content: "", indent: 0 }],
    createdAt: now,
    updatedAt: now,
    isPublished: false,
  };
  db.notes.push(note);
  persist(db);
  return note;
}

export function updateNote(
  id: string,
  patch: Partial<Pick<NoteDoc, "title" | "icon" | "blocks" | "order" | "groupId">>
) {
  const db = load();
  const n = db.notes.find((n) => n.id === id);
  if (!n) return undefined;
  // Drop undefined keys — a partial save (e.g. title only) must never
  // clobber fields it didn't include (was wiping blocks to undefined).
  const clean = Object.fromEntries(
    Object.entries(patch).filter(([, v]) => v !== undefined)
  );
  Object.assign(n, clean, { updatedAt: new Date().toISOString() });
  persist(db);
  return n;
}

export function deleteNote(id: string) {
  const db = load();
  db.notes = db.notes.filter((n) => n.id !== id);
  persist(db);
}

export function reorderNotes(moves: Array<{ id: string; groupId: string; order: number }>) {
  const db = load();
  for (const m of moves) {
    const n = db.notes.find((n) => n.id === m.id);
    if (n) {
      n.groupId = m.groupId;
      n.order = m.order;
    }
  }
  persist(db);
}

export function setPublishState(
  id: string,
  patch: Partial<Pick<NoteDoc, "isPublished" | "shareToken" | "passwordHash" | "publishedAt">>
) {
  const db = load();
  const n = db.notes.find((n) => n.id === id);
  if (!n) return undefined;
  Object.assign(n, patch);
  persist(db);
  return n;
}
