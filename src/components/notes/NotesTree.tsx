"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  BookMarked, Check as CheckIcon, ChevronDown, ChevronRight, FilePlus2,
  FolderPlus, Globe, MoreHorizontal, Pencil, Plus, StickyNote, Trash2,
  X as XIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { emitNotesChanged, normalizeTree, onNotesChanged } from "@/lib/notesClient";
import type { NotesTreeData } from "@/types/notes";

/**
 * Sidebar "Notes" section — a three-level tree:
 *   Category ("Discrete Mathematics") → Section ("Class Lecture") → Notes.
 * Inline CRUD at every level plus HTML5 drag-and-drop reordering.
 */

type Renaming = { kind: "category" | "group" | "note"; id: string; value: string };
type Adding = { kind: "category" } | { kind: "group"; categoryId: string };
type Dragging = { kind: "group" | "note"; id: string };

function InlineInput({
  value,
  placeholder,
  onChange,
  onCommit,
  onCancel,
}: {
  value: string;
  placeholder?: string;
  onChange: (v: string) => void;
  onCommit: () => void;
  onCancel: () => void;
}) {
  return (
    <div className="flex w-full items-center gap-1">
      <input
        autoFocus
        className="w-full min-w-0 flex-1 rounded border border-input bg-background px-1.5 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-ring"
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") onCommit();
          if (e.key === "Escape") onCancel();
        }}
        onBlur={onCommit}
      />
      {/* onMouseDown so these fire before the input's blur */}
      <button
        className="flex h-6 w-6 shrink-0 items-center justify-center rounded bg-primary text-primary-foreground hover:bg-primary/90"
        title="Save (Enter)"
        onMouseDown={(e) => { e.preventDefault(); onCommit(); }}
      >
        <CheckIcon className="h-3.5 w-3.5" />
      </button>
      <button
        className="flex h-6 w-6 shrink-0 items-center justify-center rounded border border-border text-muted-foreground hover:bg-muted"
        title="Cancel (Esc)"
        onMouseDown={(e) => { e.preventDefault(); onCancel(); }}
      >
        <XIcon className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}

function RowMenu({
  open,
  onToggle,
  onRename,
  onDelete,
}: {
  open: boolean;
  onToggle: (e: React.MouseEvent) => void;
  onRename: () => void;
  onDelete: () => void;
}) {
  return (
    <div className="relative">
      <button
        className="rounded p-0.5 opacity-0 transition-opacity hover:bg-muted group-hover/row:opacity-100"
        onClick={onToggle}
      >
        <MoreHorizontal className="h-3.5 w-3.5" />
      </button>
      {open && (
        <div className="absolute right-0 top-6 z-50 w-36 rounded-lg border border-border bg-card py-1 shadow-lg">
          <button
            className="flex w-full items-center gap-2 px-3 py-1.5 text-xs hover:bg-muted"
            onClick={onRename}
          >
            <Pencil className="h-3 w-3" /> Rename
          </button>
          <button
            className="flex w-full items-center gap-2 px-3 py-1.5 text-xs text-destructive hover:bg-destructive/10"
            onClick={onDelete}
          >
            <Trash2 className="h-3 w-3" /> Delete
          </button>
        </div>
      )}
    </div>
  );
}

export function NotesTree() {
  const pathname = usePathname();
  const router = useRouter();
  const [data, setData] = React.useState<NotesTreeData>({ categories: [], groups: [], notes: [] });
  const [open, setOpen] = React.useState(true);
  const [closedCats, setClosedCats] = React.useState<Record<string, boolean>>({});
  const [closedGroups, setClosedGroups] = React.useState<Record<string, boolean>>({});
  const [renaming, setRenaming] = React.useState<Renaming | null>(null);
  const [adding, setAdding] = React.useState<Adding | null>(null);
  const [addTitle, setAddTitle] = React.useState("");
  const [menuFor, setMenuFor] = React.useState<string | null>(null);
  const [drag, setDrag] = React.useState<Dragging | null>(null);
  const [dropHint, setDropHint] = React.useState<string | null>(null);

  const refresh = React.useCallback(() => {
    fetch("/api/notes-app")
      .then((r) => r.json())
      .then((raw) => setData(normalizeTree(raw)))
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

  const commitAdd = async () => {
    const current = adding;
    setAdding(null);
    const title = addTitle.trim();
    setAddTitle("");
    if (!current || !title) return;
    if (current.kind === "category") {
      await api("/api/notes-app/categories", "POST", { title });
    } else {
      await api("/api/notes-app/groups", "POST", { categoryId: current.categoryId, title });
    }
  };

  const commitRename = async () => {
    if (!renaming) return;
    const { kind, id, value } = renaming;
    setRenaming(null);
    if (!value.trim()) return;
    const url =
      kind === "category" ? `/api/notes-app/categories/${id}`
      : kind === "group" ? `/api/notes-app/groups/${id}`
      : `/api/notes-app/notes/${id}`;
    await api(url, "PATCH", { title: value });
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

  const groupsInCat = (cid: string) =>
    data.groups.filter((g) => g.categoryId === cid).sort((a, z) => a.order - z.order);
  const notesInGroup = (gid: string) =>
    data.notes.filter((n) => n.groupId === gid).sort((a, z) => a.order - z.order);

  const deleteCategory = async (id: string, title: string) => {
    const gids = groupsInCat(id).map((g) => g.id);
    const noteCount = data.notes.filter((n) => gids.includes(n.groupId)).length;
    if (!confirm(`Delete category "${title}" with ${gids.length} section(s) and ${noteCount} note(s)?`)) return;
    await api(`/api/notes-app/categories/${id}`, "DELETE");
  };

  const deleteGroup = async (id: string, title: string) => {
    const count = notesInGroup(id).length;
    if (!confirm(`Delete section "${title}"${count ? ` and its ${count} note(s)` : ""}?`)) return;
    await api(`/api/notes-app/groups/${id}`, "DELETE");
  };

  const deleteNote = async (id: string, title: string) => {
    if (!confirm(`Delete note "${title || "Untitled"}"?`)) return;
    await api(`/api/notes-app/notes/${id}`, "DELETE");
    if (pathname === `/notes/${id}`) router.push("/notes");
  };

  /* ── drag & drop ─────────────────────────────────────── */

  const dropNote = async (targetGroupId: string, afterNoteId?: string) => {
    if (drag?.kind !== "note") return;
    const moving = data.notes.find((n) => n.id === drag.id);
    if (!moving) return;
    const list = notesInGroup(targetGroupId).filter((n) => n.id !== drag.id);
    const at = afterNoteId ? list.findIndex((n) => n.id === afterNoteId) + 1 : list.length;
    list.splice(at, 0, { ...moving, groupId: targetGroupId });
    await api("/api/notes-app/notes", "PATCH", {
      moves: list.map((n, i) => ({ id: n.id, groupId: targetGroupId, order: i })),
    });
  };

  const dropGroup = async (targetCategoryId: string, afterGroupId?: string) => {
    if (drag?.kind !== "group") return;
    const moving = data.groups.find((g) => g.id === drag.id);
    if (!moving) return;
    const list = groupsInCat(targetCategoryId).filter((g) => g.id !== drag.id);
    const at = afterGroupId ? list.findIndex((g) => g.id === afterGroupId) + 1 : list.length;
    list.splice(at, 0, { ...moving, categoryId: targetCategoryId });
    await api("/api/notes-app/groups", "PATCH", {
      moves: list.map((g, i) => ({ id: g.id, categoryId: targetCategoryId, order: i })),
    });
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
          title="New category"
          onClick={() => { setOpen(true); setAdding({ kind: "category" }); }}
        >
          <Plus className="h-3.5 w-3.5" />
        </button>
      </div>

      {open && (
        <div className="space-y-0.5 px-1">
          {/* All-notes link */}
          <Link
            href="/notes"
            className={cn(
              "mx-1 flex items-center gap-3 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors",
              pathname === "/notes"
                ? "bg-primary/10 text-primary"
                : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
            )}
          >
            <StickyNote className="h-[18px] w-[18px] shrink-0" />
            All Notes
          </Link>

          {/* ── Categories ── */}
          {data.categories.map((cat) => {
            const groups = groupsInCat(cat.id);
            const catClosed = closedCats[cat.id];
            return (
              <div
                key={cat.id}
                onDragOver={(e) => {
                  if (drag) { e.preventDefault(); setDropHint(`c-${cat.id}`); }
                }}
                onDragLeave={() => setDropHint((h) => (h === `c-${cat.id}` ? null : h))}
                onDrop={(e) => {
                  e.preventDefault();
                  if (drag?.kind === "group") void dropGroup(cat.id);
                  endDrag();
                }}
                className={cn(dropHint === `c-${cat.id}` && drag?.kind === "group" && "rounded-lg ring-1 ring-primary/50")}
              >
                {/* Category row */}
                <div className="group/row mx-1 flex items-center gap-1 rounded-lg px-2 py-1.5 hover:bg-accent">
                  <button
                    className="rounded p-0.5 hover:bg-muted"
                    onClick={() => setClosedCats((c) => ({ ...c, [cat.id]: !catClosed }))}
                  >
                    {catClosed ? <ChevronRight className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                  </button>
                  <BookMarked className="h-3.5 w-3.5 shrink-0 text-primary" />
                  {renaming?.kind === "category" && renaming.id === cat.id ? (
                    <InlineInput
                      value={renaming.value}
                      onChange={(v) => setRenaming({ ...renaming, value: v })}
                      onCommit={() => void commitRename()}
                      onCancel={() => setRenaming(null)}
                    />
                  ) : (
                    <span
                      className="flex-1 truncate text-sm font-semibold"
                      onDoubleClick={() => setRenaming({ kind: "category", id: cat.id, value: cat.title })}
                    >
                      {cat.title}
                    </span>
                  )}
                  <button
                    className="rounded p-0.5 opacity-0 transition-opacity hover:bg-muted group-hover/row:opacity-100"
                    title="New section"
                    onClick={() => {
                      setClosedCats((c) => ({ ...c, [cat.id]: false }));
                      setAdding({ kind: "group", categoryId: cat.id });
                    }}
                  >
                    <FolderPlus className="h-3.5 w-3.5" />
                  </button>
                  <RowMenu
                    open={menuFor === `c-${cat.id}`}
                    onToggle={(e) => { e.stopPropagation(); setMenuFor(menuFor === `c-${cat.id}` ? null : `c-${cat.id}`); }}
                    onRename={() => setRenaming({ kind: "category", id: cat.id, value: cat.title })}
                    onDelete={() => void deleteCategory(cat.id, cat.title)}
                  />
                </div>

                {/* New section input */}
                {adding?.kind === "group" && adding.categoryId === cat.id && (
                  <div className="mx-1 py-1 pl-8 pr-2">
                    <InlineInput
                      value={addTitle}
                      placeholder="Section name… (e.g. Class Lecture)"
                      onChange={setAddTitle}
                      onCommit={() => void commitAdd()}
                      onCancel={() => { setAdding(null); setAddTitle(""); }}
                    />
                  </div>
                )}

                {/* ── Sections (groups) ── */}
                {!catClosed && groups.map((group) => {
                  const notes = notesInGroup(group.id);
                  const grpClosed = closedGroups[group.id];
                  return (
                    <div
                      key={group.id}
                      onDragOver={(e) => {
                        if (drag) { e.preventDefault(); e.stopPropagation(); setDropHint(`g-${group.id}`); }
                      }}
                      onDragLeave={() => setDropHint((h) => (h === `g-${group.id}` ? null : h))}
                      onDrop={(e) => {
                        e.preventDefault(); e.stopPropagation();
                        if (drag?.kind === "note") void dropNote(group.id);
                        if (drag?.kind === "group") void dropGroup(cat.id, group.id);
                        endDrag();
                      }}
                      className={cn(dropHint === `g-${group.id}` && drag && "rounded-lg ring-1 ring-primary/40")}
                    >
                      {/* Section row */}
                      <div
                        className="group/row mx-1 flex items-center gap-1 rounded-lg py-1 pl-6 pr-2 text-xs font-semibold text-muted-foreground hover:bg-accent"
                        draggable={!renaming}
                        onDragStart={(e) => { e.stopPropagation(); setDrag({ kind: "group", id: group.id }); }}
                        onDragEnd={endDrag}
                      >
                        <button
                          className="rounded p-0.5 hover:bg-muted"
                          onClick={() => setClosedGroups((c) => ({ ...c, [group.id]: !grpClosed }))}
                        >
                          {grpClosed ? <ChevronRight className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                        </button>
                        {renaming?.kind === "group" && renaming.id === group.id ? (
                          <InlineInput
                            value={renaming.value}
                            onChange={(v) => setRenaming({ ...renaming, value: v })}
                            onCommit={() => void commitRename()}
                            onCancel={() => setRenaming(null)}
                          />
                        ) : (
                          <span
                            className="flex-1 truncate"
                            onDoubleClick={() => setRenaming({ kind: "group", id: group.id, value: group.title })}
                          >
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
                        <RowMenu
                          open={menuFor === `g-${group.id}`}
                          onToggle={(e) => { e.stopPropagation(); setMenuFor(menuFor === `g-${group.id}` ? null : `g-${group.id}`); }}
                          onRename={() => setRenaming({ kind: "group", id: group.id, value: group.title })}
                          onDelete={() => void deleteGroup(group.id, group.title)}
                        />
                      </div>

                      {/* ── Notes ── */}
                      {!grpClosed && notes.map((note) => {
                        const active = pathname === `/notes/${note.id}`;
                        return (
                          <div
                            key={note.id}
                            className={cn(
                              "group/row mx-1 flex items-center gap-1 rounded-lg py-1 pl-11 pr-2",
                              active
                                ? "bg-primary/10 text-primary"
                                : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
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
                              <InlineInput
                                value={renaming.value}
                                onChange={(v) => setRenaming({ ...renaming, value: v })}
                                onCommit={() => void commitRename()}
                                onCancel={() => setRenaming(null)}
                              />
                            ) : (
                              <Link href={`/notes/${note.id}`} className="flex min-w-0 flex-1 items-center gap-1.5 text-sm">
                                <span className="shrink-0 text-sm">{note.icon ?? "📄"}</span>
                                <span className="truncate">{note.title || "Untitled"}</span>
                                {note.isPublished && <Globe className="h-3 w-3 shrink-0 text-primary" />}
                              </Link>
                            )}
                            <RowMenu
                              open={menuFor === `n-${note.id}`}
                              onToggle={(e) => { e.stopPropagation(); setMenuFor(menuFor === `n-${note.id}` ? null : `n-${note.id}`); }}
                              onRename={() => setRenaming({ kind: "note", id: note.id, value: note.title })}
                              onDelete={() => void deleteNote(note.id, note.title)}
                            />
                          </div>
                        );
                      })}
                    </div>
                  );
                })}
              </div>
            );
          })}

          {/* New category — always visible */}
          {adding?.kind === "category" ? (
            <div className="mx-2 px-2 py-1">
              <InlineInput
                value={addTitle}
                placeholder="Category name… (e.g. Discrete Mathematics)"
                onChange={setAddTitle}
                onCommit={() => void commitAdd()}
                onCancel={() => { setAdding(null); setAddTitle(""); }}
              />
            </div>
          ) : (
            <button
              className="mx-1 flex w-[calc(100%-0.5rem)] items-center gap-2 rounded-lg px-3 py-1.5 text-xs font-medium text-muted-foreground/70 transition-colors hover:bg-accent hover:text-foreground"
              onClick={() => setAdding({ kind: "category" })}
            >
              <Plus className="h-3.5 w-3.5" /> New Category
            </button>
          )}
        </div>
      )}
    </div>
  );
}
