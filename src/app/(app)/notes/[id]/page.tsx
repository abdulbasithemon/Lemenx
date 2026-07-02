"use client";

import * as React from "react";
import { useParams, useRouter } from "next/navigation";
import { Globe, Loader2, Share2, Smile } from "lucide-react";
import { Button } from "@/components/ui/button";
import { BlockEditor } from "@/components/notes/BlockEditor";
import { PublishModal } from "@/components/notes/PublishModal";
import { emitNotesChanged } from "@/lib/notesClient";
import { cn } from "@/lib/utils";
import type { Block, NoteDTO, NotesTreeData } from "@/types/notes";

const EMOJI_CHOICES = ["📄","📝","💡","🎯","📌","🔥","⭐","💰","🏠","💪","📚","🧠","✈️","🍀","🎨","🛒"];

export default function NoteEditorPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const noteId = params.id;

  const [note, setNote] = React.useState<NoteDTO | null>(null);
  const [notFound, setNotFound] = React.useState(false);
  const [noteTitles, setNoteTitles] = React.useState<Record<string, { title: string; icon?: string }>>({});
  const [tree, setTree] = React.useState<NotesTreeData | null>(null);
  const [saveState, setSaveState] = React.useState<"saved" | "saving" | "idle">("idle");
  const [showPublish, setShowPublish] = React.useState(false);
  const [showEmoji, setShowEmoji] = React.useState(false);
  const saveTimer = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  /* ── load ────────────────────────────────────────────── */

  React.useEffect(() => {
    setNote(null);
    setNotFound(false);
    fetch(`/api/notes-app/notes/${noteId}`)
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then(setNote)
      .catch(() => setNotFound(true));
    fetch("/api/notes-app")
      .then((r) => r.json())
      .then((t: NotesTreeData) => {
        setTree(t);
        const map: Record<string, { title: string; icon?: string }> = {};
        for (const n of t.notes ?? []) map[n.id] = { title: n.title, icon: n.icon };
        setNoteTitles(map);
      })
      .catch(() => {});
  }, [noteId]);

  /* ── debounced autosave ──────────────────────────────── */

  const scheduleSave = React.useCallback(
    (patch: Partial<Pick<NoteDTO, "title" | "icon" | "blocks">>, current: NoteDTO) => {
      setSaveState("saving");
      if (saveTimer.current) clearTimeout(saveTimer.current);
      saveTimer.current = setTimeout(async () => {
        await fetch(`/api/notes-app/notes/${current.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(patch),
        });
        setSaveState("saved");
        emitNotesChanged();
      }, 700);
    },
    []
  );

  const setBlocks = (blocks: Block[]) => {
    if (!note) return;
    const next = { ...note, blocks };
    setNote(next);
    scheduleSave({ blocks }, next);
  };

  const setTitle = (title: string) => {
    if (!note) return;
    const next = { ...note, title };
    setNote(next);
    scheduleSave({ title }, next);
  };

  const setIcon = (icon: string) => {
    if (!note) return;
    const next = { ...note, icon };
    setNote(next);
    setShowEmoji(false);
    scheduleSave({ icon }, next);
  };

  /* ── sub-page creation for `page` blocks ─────────────── */

  const createSubpage = async () => {
    const res = await fetch("/api/notes-app/notes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ groupId: note!.groupId, title: "Untitled" }),
    });
    const page: NoteDTO = await res.json();
    setNoteTitles((m) => ({ ...m, [page.id]: { title: page.title, icon: page.icon } }));
    emitNotesChanged();
    return { id: page.id, title: page.title };
  };

  /* ── render ──────────────────────────────────────────── */

  if (notFound) {
    return (
      <div className="py-24 text-center">
        <p className="text-lg font-semibold">Note not found</p>
        <p className="mt-1 text-sm text-muted-foreground">It may have been deleted.</p>
        <Button className="mt-4" variant="outline" onClick={() => router.push("/notes")}>
          Back to Notes
        </Button>
      </div>
    );
  }

  if (!note) {
    return (
      <div className="flex items-center justify-center py-24 text-muted-foreground">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl">
      {/* Top bar */}
      <div className="mb-6 flex items-center justify-between gap-3">
        <span className={cn(
          "text-xs",
          saveState === "saving" ? "text-amber-600" : "text-muted-foreground"
        )}>
          {saveState === "saving" ? "Saving…" : saveState === "saved" ? "Saved" : ""}
        </span>
        <div className="flex items-center gap-2">
          {note.isPublished && (
            <span className="flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary">
              <Globe className="h-3 w-3" /> Published
            </span>
          )}
          <Button variant="outline" size="sm" onClick={() => setShowPublish(true)}>
            <Share2 className="h-4 w-4" /> Share
          </Button>
        </div>
      </div>

      {/* Icon + title */}
      <div className="mb-2">
        <div className="relative inline-block">
          <button
            className="rounded-lg p-1 text-5xl transition-colors hover:bg-muted"
            title="Change icon"
            onClick={() => setShowEmoji((v) => !v)}
          >
            {note.icon ?? <Smile className="h-10 w-10 text-muted-foreground/40" />}
          </button>
          {showEmoji && (
            <div className="absolute left-0 top-full z-50 mt-1 grid w-64 grid-cols-8 gap-1 rounded-xl border border-border bg-card p-2 shadow-xl">
              {EMOJI_CHOICES.map((e) => (
                <button
                  key={e}
                  className="rounded p-1 text-xl hover:bg-muted"
                  onClick={() => setIcon(e)}
                >
                  {e}
                </button>
              ))}
            </div>
          )}
        </div>
        <input
          className="mt-2 w-full bg-transparent text-4xl font-bold tracking-tight placeholder:text-muted-foreground/40 focus:outline-none"
          placeholder="Untitled"
          value={note.title}
          onChange={(e) => setTitle(e.target.value)}
        />
      </div>

      {/* Block editor */}
      <BlockEditor
        blocks={note.blocks}
        onChange={setBlocks}
        noteTitles={noteTitles}
        onCreateSubpage={createSubpage}
        onOpenNote={(id) => router.push(`/notes/${id}`)}
        breadcrumb={(() => {
          const group = tree?.groups?.find((g) => g.id === note.groupId);
          const cat = tree?.categories?.find((c) => c.id === group?.categoryId);
          return [cat?.title, group?.title, note.title || "Untitled"].filter(Boolean).join(" / ");
        })()}
      />

      {/* Publish modal */}
      {showPublish && (
        <PublishModal
          note={note}
          onUpdated={(n) => {
            setNote(n);
            emitNotesChanged();
          }}
          onClose={() => setShowPublish(false)}
        />
      )}
    </div>
  );
}
