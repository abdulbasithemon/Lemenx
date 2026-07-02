"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  ChevronDown, ChevronRight, FilePlus2, FolderPlus, Globe,
  MoreHorizontal, Pencil, StickyNote, Trash2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { emitNotesChanged, onNotesChanged } from "@/lib/notesClient";
import type { NotesTreeData } from "@/types/notes";

type TreeNote = NotesTreeData["notes"][number];

/**
 * Sidebar "Notes" section — Notion-style tree of Groups → Notes with
 * inline CRUD and HTML5 drag-and-drop reordering.
 */
export function NotesTree() {
  const pathname = usePathname();
  const router = useRouter();
  const [data, setData] = React.useState<NotesTreeData>({ groups: [], notes: [] });
  const [open, setOpen] = React.useState(true);
  const [collapsed, setCollapsed] = React.useState<Record<string, boolean>>({});
  const [renaming, setRenaming] = React.useState<{ kind: "group" | "note"; id: string; value: string } | null>(null);
  const [addingGroup, setAddingGroup] = React.useState(false);
  const [newGroupTitle, setNewGroupTitle] = React.useState("");
  const [menuFor, setMenuFor] = React.useState<string | null>(null);
  const [drag, setDrag] = React.useState<{ kind: "group" | "note"; id: string } | null>(null);
  const [dropHint, setDropHint] = React.useState<string | null>(null);

  const refresh = React.useCallback(() => {
    fetch("/api/notes-app")
      .then((r) => r.json())
      .then(setData)
      .catch(() => {});
  }, []);

  React.useEffect(() => {
    refresh();
    return onNotesChanged(refresh);
  }, [refresh]);

  React.useEffect(() => {
    const close = () => setMenuFor(null);
    document.addEventListener("click", close);
    return () => document.removeEventListener("click", close);
  }, []);

  /* ── API helpers ─────────────────────────────────────── */

  const api = async (url: string, method: string, body?: unknown) => {
    await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
    refresh();
    emitNotesChanged();
  };

  const createGroup = async () => {
    if (!newGroupTitle.trim()) { setAddingGroup(false); return; }
    await api("/api/notes-app/groups", "POST", { title: newGroupTitle });
    setNewGroupTitle("");
    setAddingGroup(false);
  };

  const createNote = async (groupId: string) => {
    const res = await fetch("/api/notes-app/notes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ groupId }),
    });
    const note = await res.json();
    refresh();
    emitNotesChanged();
    router.push(`/notes/${note.id}`);
  };

  const commitRename = async () => {
    if (!renaming) return;
    const { kind, id, value } = renaming;
    setRenaming(null);
    if (!value.trim()) return;
    if (kind === "group") await api(`/api/notes-app/groups/${id}`, "PATCH", { title: value });
    else await api(`/api/notes-app/notes/${id}`, "PATCH", { title: value });
  };

  const deleteGroup = async (id: string, title: string) => {
    const count = data.notes.filter((n) => n.groupId === id).length;
    if (!confirm(`Delete group "${title}"${count ? ` and its ${count} note(s)` : ""}?`)) return;
    await api(`/api/notes-app/groups/${id}`, "DELETE");
  };

  const deleteNote = async (id: string, title: string) => {
    if (!confirm(`Delete note "${title}"?`)) return;
    await api(`/api/notes-app/notes/${id}`, "DELETE");
    if (pathname === `/notes/${id}`) router.push("/notes");
  };

  /* ── drag & drop ─────────────────────────────────────── */

  const notesInGroup = (gid: string) =>
    data.notes.filter((n) => n.groupId === gid).sort((a, z) => a.order - z.order);

  const dropNote = async (targetGroupId: string, targetNoteId?: string) => {
    if (!drag || drag.kind !== "note") return;
    const moving = data.notes.find((n) => n.id === drag.id);
    if (!moving) return;
    const list = notesInGroup(targetGroupId).filter((n) => n.id !== drag.id);
    const at = targetNoteId ? list.findIndex((n) => n.id === targetNoteId) + 1 : list.length;
    list.splice(at, 0, { ...moving, groupId: targetGroupId });
    await api("/api/notes-app/notes", "PATCH", {
      moves: list.map((n, i) => ({ id: n.id, groupId: targetGroupId, order: i })),
    });
  };

  const dropGroup = async (targetGroupId: string) => {
    if (!drag || drag.kind !== "group" || drag.id === targetGroupId) return;
    const ids = data.groups.map((g) => g.id).filter((id) => id !== drag.id);
    ids.splice(ids.indexOf(targetGroupId) + 1, 0, drag.id);
    await api("/api/notes-app/groups", "PATCH", { orderedIds: ids });
  };

  const endDrag = () => { setDrag(null); setDropHint(null); };

  /* ── render ──────────────────────────────────────────── */

  return (
    <div>
      {/* Section header */}
      <div className="group/hdr flex items-center gap-1 px-3 pb-2">
        <button
          className="flex items-center gap-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground hover:text-foreground"
          onClick={() => setOpen((v) => !v)}
        >
          {open ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
          Notes
        </button>
        <span className="flex-1" />
        <button
          className="rounded p-0.5 text-muted-foreground opacity-0 transition-opacity hover:bg-accent group-hover/hdr:opacity-100"
          title="New group"
          onClick={() => { setOpen(true); setAddingGroup(true); }}
        >
          <FolderPlus className="h-3.5 w-3.5" />
        </button>
      </div>

      {open && (
        <div className="space-y-0.5 px-1">
          {/* All-notes link */}
          <Link
            href="/notes"
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors mx-1",
              pathname === "/notes"
                ? "bg-primary/10 text-primary"
                : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
            )}
          >
            <StickyNote className="h-[18px] w-[18px] shrink-0" />
            All Notes
          </Link>

          {data.groups.map((group) => {
            const notes = notesInGroup(group.id);
            const isCollapsed = collapsed[group.id];
            return (
              <div
                key={group.id}
                onDragOver={(e) => {
                  if (drag) { e.preventDefault(); setDropHint(`g-${group.id}`); }
                }}
                onDrop={(e) => {
                  e.preventDefault();
                  if (drag?.kind === "note") void dropNote(group.id);
                  if (drag?.kind === "group") void dropGroup(group.id);
                  endDrag();
                }}
                className={cn(dropHint === `g-${group.id}` && drag && "rounded-lg ring-1 ring-primary/50")}
                onDragLeave={() => setDropHint((h) => (h === `g-${group.id}` ? null : h))}
              >
                {/* Group row */}
                <div
                  className="group/row mx-1 flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-semibold text-muted-foreground hover:bg-accent"
                  draggable={!renaming}
                  onDragStart={() => setDrag({ kind: "group", id: group.id })}
                  onDragEnd={endDrag}
                >
                  <button
                    className="rounded p-0.5 hover:bg-muted"
                    onClick={() => setCollapsed((c) => ({ ...c, [group.id]: !isCollapsed }))}
                  >
                    {isCollapsed ? <ChevronRight className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                  </button>
                  {renaming?.kind === "group" && renaming.id === group.id ? (
                    <input
                      autoFocus
                      className="w-full rounded border border-input bg-background px-1 py-0.5 text-xs focus:outline-none"
                      value={renaming.value}
                      onChange={(e) => setRenaming({ ...renaming, value: e.target.value })}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") void commitRename();
                        if (e.key === "Escape") setRenaming(null);
                      }}
                      onBlur={() => void commitRename()}
                    />
                  ) : (
                    <span className="flex-1 truncate" onDoubleClick={() => setRenaming({ kind: "group", id: group.id, value: group.title })}>
                      {group.title}
                    </span>
                  )}
                  <span className="text-[10px] font-normal">{notes.length}</span>
                  <button
                    className="rounded p-0.5 opacity-0 transition-opacity hover:bg-muted group-hover/row:opacity-100"
                    title="New note"
                    onClick={() => void createNote(group.id)}
                  >
                    <FilePlus2 className="h-3.5 w-3.5" />
                  </button>
                  <div className="relative">
                    <button
                      className="rounded p-0.5 opacity-0 transition-opacity hover:bg-muted group-hover/row:opacity-100"
                      onClick={(e) => { e.stopPropagation(); setMenuFor(menuFor === `g-${group.id}` ? null : `g-${group.id}`); }}
                    >
                      <MoreHorizontal className="h-3.5 w-3.5" />
                    </button>
                    {menuFor === `g-${group.id}` && (
                      <div className="absolute right-0 top-6 z-50 w-36 rounded-lg border border-border bg-card py-1 shadow-lg">
                        <button
                          className="flex w-full items-center gap-2 px-3 py-1.5 text-xs hover:bg-muted"
                          onClick={() => setRenaming({ kind: "group", id: group.id, value: group.title })}
                        >
                          <Pencil className="h-3 w-3" /> Rename
                        </button>
                        <button
                          className="flex w-full items-center gap-2 px-3 py-1.5 text-xs text-destructive hover:bg-destructive/10"
                          onClick={() => void deleteGroup(group.id, group.title)}
                        >
                          <Trash2 className="h-3 w-3" /> Delete
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Notes */}
                {!isCollapsed && notes.map((note: TreeNote) => {
                  const active = pathname === `/notes/${note.id}`;
                  return (
                    <div
                      key={note.id}
                      className={cn(
                        "group/row mx-1 flex items-center gap-1 rounded-lg py-1 pl-7 pr-2",
                        active ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
                        dropHint === `n-${note.id}` && drag?.kind === "note" && "border-b-2 border-primary"
                      )}
                      draggable={!renaming}
                      onDragStart={(e) => { e.stopPropagation(); setDrag({ kind: "note", id: note.id }); }}
                      onDragEnd={endDrag}
                      onDragOver={(e) => {
                        if (drag?.kind === "note") { e.preventDefault(); e.stopPropagation(); setDropHint(`n-${note.id}`); }
                      }}
                      onDrop={(e) => {
                        if (drag?.kind === "note") {
                          e.preventDefault(); e.stopPropagation();
                          void dropNote(group.id, note.id);
                          endDrag();
                        }
                      }}
                    >
                      {renaming?.kind === "note" && renaming.id === note.id ? (
                        <input
                          autoFocus
                          className="w-full rounded border border-input bg-background px-1 py-0.5 text-xs focus:outline-none"
                          value={renaming.value}
                          onChange={(e) => setRenaming({ ...renaming, value: e.target.value })}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") void commitRename();
                            if (e.key === "Escape") setRenaming(null);
                          }}
                          onBlur={() => void commitRename()}
                        />
                      ) : (
                        <Link href={`/notes/${note.id}`} className="flex min-w-0 flex-1 items-center gap-1.5 text-sm">
                          <span className="shrink-0 text-sm">{note.icon ?? "📄"}</span>
                          <span className="truncate">{note.title || "Untitled"}</span>
                          {note.isPublished && <Globe className="h-3 w-3 shrink-0 text-primary" />}
                        </Link>
                      )}
                      <div className="relative">
                        <button
                          className="rounded p-0.5 opacity-0 transition-opacity hover:bg-muted group-hover/row:opacity-100"
                          onClick={(e) => { e.stopPropagation(); setMenuFor(menuFor === `n-${note.id}` ? null : `n-${note.id}`); }}
                        >
                          <MoreHorizontal className="h-3.5 w-3.5" />
                        </button>
                        {menuFor === `n-${note.id}` && (
                          <div className="absolute right-0 top-6 z-50 w-36 rounded-lg border border-border bg-card py-1 shadow-lg">
                            <button
                              className="flex w-full items-center gap-2 px-3 py-1.5 text-xs hover:bg-muted"
                              onClick={() => setRenaming({ kind: "note", id: note.id, value: note.title })}
                            >
                              <Pencil className="h-3 w-3" /> Rename
                            </button>
                            <button
                              className="flex w-full items-center gap-2 px-3 py-1.5 text-xs text-destructive hover:bg-destructive/10"
                              onClick={() => void deleteNote(note.id, note.title)}
                            >
                              <Trash2 className="h-3 w-3" /> Delete
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            );
          })}

          {/* New group input */}
          {addingGroup && (
            <div className="mx-2 px-2 py-1">
              <input
                autoFocus
                className="w-full rounded border border-input bg-background px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-ring"
                placeholder="Group name…"
                value={newGroupTitle}
                onChange={(e) => setNewGroupTitle(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") void createGroup();
                  if (e.key === "Escape") { setAddingGroup(false); setNewGroupTitle(""); }
                }}
                onBlur={() => void createGroup()}
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
