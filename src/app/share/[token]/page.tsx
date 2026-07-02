"use client";

import * as React from "react";
import { useParams } from "next/navigation";
import { FileQuestion, KeyRound, Loader2, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ReadOnlyBlocks } from "@/components/notes/ReadOnlyBlocks";
import type { Block } from "@/types/notes";

interface SharedNote {
  title: string;
  icon?: string;
  blocks: Block[];
  publishedAt?: string;
  updatedAt: string;
}

type ViewState =
  | { phase: "loading" }
  | { phase: "notfound" }
  | { phase: "password"; error?: string; busy?: boolean }
  | { phase: "ready"; note: SharedNote };

/**
 * Public, view-only page for a published note.
 * No sidebar, no edit controls — and a password gate when one is set.
 */
export default function SharedNotePage() {
  const params = useParams<{ token: string }>();
  const [state, setState] = React.useState<ViewState>({ phase: "loading" });
  const [password, setPassword] = React.useState("");

  React.useEffect(() => {
    fetch(`/api/share/${params.token}`)
      .then(async (r) => {
        if (!r.ok) return setState({ phase: "notfound" });
        const body = await r.json();
        if (body.requiresPassword) setState({ phase: "password" });
        else setState({ phase: "ready", note: body.note });
      })
      .catch(() => setState({ phase: "notfound" }));
  }, [params.token]);

  const submitPassword = async () => {
    setState({ phase: "password", busy: true });
    const r = await fetch(`/api/share/${params.token}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    });
    if (r.ok) {
      const body = await r.json();
      setState({ phase: "ready", note: body.note });
    } else if (r.status === 401) {
      setState({ phase: "password", error: "Incorrect password — try again." });
    } else {
      setState({ phase: "notfound" });
    }
  };

  /* ── states ──────────────────────────────────────────── */

  if (state.phase === "loading") {
    return (
      <div className="flex min-h-screen items-center justify-center text-muted-foreground">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  if (state.phase === "notfound") {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-3 px-4 text-center">
        <FileQuestion className="h-12 w-12 text-muted-foreground/50" />
        <h1 className="text-xl font-semibold">This note isn&apos;t available</h1>
        <p className="max-w-sm text-sm text-muted-foreground">
          The link may be wrong, or the author has unpublished this note.
        </p>
      </div>
    );
  }

  if (state.phase === "password") {
    return (
      <div className="flex min-h-screen items-center justify-center px-4">
        <div className="w-full max-w-sm rounded-2xl border border-border bg-card p-8 text-center shadow-lg">
          <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
            <Lock className="h-5 w-5" />
          </span>
          <h1 className="mt-4 text-lg font-semibold">This note is protected</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Enter the password to view it.
          </p>
          <div className="mt-5 space-y-3">
            <Input
              autoFocus
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && password && void submitPassword()}
            />
            {state.error && <p className="text-xs text-destructive">{state.error}</p>}
            <Button
              className="w-full"
              disabled={!password || state.busy}
              onClick={() => void submitPassword()}
            >
              {state.busy
                ? <Loader2 className="h-4 w-4 animate-spin" />
                : <><KeyRound className="h-4 w-4" /> Unlock</>}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  /* ── read-only note ──────────────────────────────────── */

  const { note } = state;
  return (
    <div className="min-h-screen bg-background">
      <main className="mx-auto max-w-3xl px-6 py-16">
        {note.icon && <div className="mb-3 text-5xl">{note.icon}</div>}
        <h1 className="mb-8 text-4xl font-bold tracking-tight">
          {note.title || "Untitled"}
        </h1>
        <ReadOnlyBlocks blocks={note.blocks} />
      </main>
      <footer className="border-t border-border py-6 text-center text-xs text-muted-foreground">
        Published with{" "}
        <a href="/" className="font-semibold text-primary hover:underline">LemenX</a>
        {" "}· view-only
      </footer>
    </div>
  );
}
