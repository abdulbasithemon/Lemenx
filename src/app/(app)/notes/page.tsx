"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { BookMarked, FilePlus2, Globe, Loader2, StickyNote } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { emitNotesChanged, normalizeTree, onNotesChanged } from "@/lib/notesClient";
import type { NotesTreeData } from "@/types/notes";

/** All-notes overview: Categories → Sections → Notes, click-through to the editor. */
export default function NotesIndexPage() {
  const router = useRouter();
  const [data, setData] = React.useState<NotesTreeData | null>(null);

  const refresh = React.useCallback(() => {
    fetch("/api/notes-app")
      .then((r) => r.json())
      .then((raw) => setData(normalizeTree(raw)))
      .catch(() => setData(normalizeTree(null)));
  }, []);

  React.useEffect(() => {
    refresh();
    return onNotesChanged(refresh);
  }, [refresh]);

  const createNote = async (groupId: string) => {
    const res = await fetch("/api/notes-app/notes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ groupId }),
    });
    const note = await res.json();
    emitNotesChanged();
    router.push(`/notes/${note.id}`);
  };

  if (!data) {
    return (
      <div className="flex items-center justify-center py-24 text-muted-foreground">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        icon={StickyNote}
        title="Notes"
        description="Organized by category and section — manage the tree from the sidebar."
      />

      {data.categories.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="py-16 text-center text-sm text-muted-foreground">
            No categories yet — click the + next to “Notes” in the sidebar to create one.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-10">
          {data.categories.map((cat) => {
            const groups = data.groups
              .filter((g) => g.categoryId === cat.id)
              .sort((a, z) => a.order - z.order);
            return (
              <section key={cat.id}>
                <h2 className="mb-4 flex items-center gap-2 text-lg font-bold">
                  <BookMarked className="h-4 w-4 text-primary" />
                  {cat.title}
                </h2>

                {groups.length === 0 ? (
                  <p className="rounded-lg border border-dashed border-border py-6 text-center text-sm text-muted-foreground">
                    No sections yet — hover the category in the sidebar and click the folder icon.
                  </p>
                ) : (
                  <div className="space-y-6 border-l-2 border-border pl-5">
                    {groups.map((group) => {
                      const notes = data.notes
                        .filter((n) => n.groupId === group.id)
                        .sort((a, z) => a.order - z.order);
                      return (
                        <div key={group.id}>
                          <div className="mb-2 flex items-center justify-between">
                            <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                              {group.title}
                            </h3>
                            <Button variant="ghost" size="sm" onClick={() => void createNote(group.id)}>
                              <FilePlus2 className="h-4 w-4" /> New note
                            </Button>
                          </div>
                          {notes.length === 0 ? (
                            <p className="rounded-lg border border-dashed border-border py-4 text-center text-xs text-muted-foreground">
                              Empty section — add your first note.
                            </p>
                          ) : (
                            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                              {notes.map((note) => (
                                <button
                                  key={note.id}
                                  className="flex items-start gap-3 rounded-xl border border-border bg-card p-4 text-left shadow-sm transition-shadow hover:shadow-md"
                                  onClick={() => router.push(`/notes/${note.id}`)}
                                >
                                  <span className="text-2xl">{note.icon ?? "📄"}</span>
                                  <span className="min-w-0 flex-1">
                                    <span className="block truncate font-medium">
                                      {note.title || "Untitled"}
                                    </span>
                                    {note.isPublished && (
                                      <span className="mt-1 inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-medium text-primary">
                                        <Globe className="h-2.5 w-2.5" /> Published
                                      </span>
                                    )}
                                  </span>
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </section>
            );
          })}
        </div>
      )}
    </div>
  );
}
