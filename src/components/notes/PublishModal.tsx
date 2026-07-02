"use client";

import * as React from "react";
import { Check, Copy, ExternalLink, Globe, KeyRound, Lock, LockOpen, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import type { NoteDTO } from "@/types/notes";

interface PublishModalProps {
  note: NoteDTO;
  onUpdated: (note: NoteDTO) => void;
  onClose: () => void;
}

/**
 * Publish & share controls: public link on/off, password set/remove,
 * copy link. Unpublishing revokes the token server-side immediately.
 */
export function PublishModal({ note, onUpdated, onClose }: PublishModalProps) {
  const [busy, setBusy] = React.useState(false);
  const [copied, setCopied] = React.useState(false);
  const [password, setPassword] = React.useState("");
  const [error, setError] = React.useState("");

  const shareUrl = note.shareToken
    ? `${typeof window !== "undefined" ? window.location.origin : ""}/share/${note.shareToken}`
    : "";

  const publishAction = async (action: string, extra: Record<string, unknown> = {}) => {
    setBusy(true);
    setError("");
    try {
      const res = await fetch(`/api/notes-app/notes/${note.id}/publish`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, ...extra }),
      });
      const body = await res.json();
      if (!res.ok) {
        setError(body.error ?? "Something went wrong");
        return;
      }
      onUpdated(body);
    } finally {
      setBusy(false);
    }
  };

  const copyLink = () => {
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center bg-black/40 p-4 pt-24"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-2xl border border-border bg-card shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <h3 className="flex items-center gap-2 font-semibold">
            <Globe className="h-4 w-4 text-primary" /> Publish &amp; Share
          </h3>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="space-y-5 p-5">
          {/* Publish toggle */}
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-medium">Public link</p>
              <p className="text-xs text-muted-foreground">
                {note.isPublished
                  ? "Anyone with the link can view this note (read-only)."
                  : "Turn on to generate a shareable view-only link."}
              </p>
            </div>
            <Switch
              checked={note.isPublished}
              disabled={busy}
              onCheckedChange={(on) => void publishAction(on ? "publish" : "unpublish")}
            />
          </div>

          {/* Link row */}
          {note.isPublished && note.shareToken && (
            <>
              <div className="flex gap-2">
                <div className="flex min-w-0 flex-1 items-center rounded-lg border border-input bg-muted px-3 py-2">
                  <span className="truncate text-xs text-muted-foreground">{shareUrl}</span>
                </div>
                <Button variant="outline" size="icon" onClick={copyLink} title="Copy link">
                  {copied ? <Check className="h-4 w-4 text-primary" /> : <Copy className="h-4 w-4" />}
                </Button>
                <Button variant="outline" size="icon" asChild title="Open in new tab">
                  <a href={shareUrl} target="_blank" rel="noreferrer">
                    <ExternalLink className="h-4 w-4" />
                  </a>
                </Button>
              </div>

              <Separator />

              {/* Password protection */}
              <div>
                <div className="mb-2 flex items-center gap-2">
                  {note.hasPassword
                    ? <Lock className="h-4 w-4 text-primary" />
                    : <LockOpen className="h-4 w-4 text-muted-foreground" />}
                  <p className="text-sm font-medium">
                    {note.hasPassword ? "Password protection is ON" : "Password protection"}
                  </p>
                </div>
                <p className="mb-3 text-xs text-muted-foreground">
                  {note.hasPassword
                    ? "Visitors must enter the password before viewing. Set a new one below or remove it."
                    : "Optionally require a password before anyone can view this note."}
                </p>
                <div className="flex gap-2">
                  <Input
                    type="password"
                    placeholder={note.hasPassword ? "New password…" : "Set a password…"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && password) {
                        void publishAction("setPassword", { password }).then(() => setPassword(""));
                      }
                    }}
                  />
                  <Button
                    disabled={busy || password.length < 4}
                    onClick={() => void publishAction("setPassword", { password }).then(() => setPassword(""))}
                  >
                    <KeyRound className="h-4 w-4" />
                    {note.hasPassword ? "Change" : "Set"}
                  </Button>
                </div>
                {note.hasPassword && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="mt-2 text-destructive hover:bg-destructive/10"
                    disabled={busy}
                    onClick={() => void publishAction("removePassword")}
                  >
                    Remove password
                  </Button>
                )}
                {error && <p className="mt-2 text-xs text-destructive">{error}</p>}
                <p className="mt-2 text-[11px] text-muted-foreground">
                  Passwords are stored as bcrypt hashes — never in plain text.
                </p>
              </div>
            </>
          )}

          {note.isPublished && (
            <p className="rounded-lg bg-muted p-3 text-[11px] leading-relaxed text-muted-foreground">
              Turning the public link off revokes the URL immediately — old links stop
              working. Publishing again generates a brand-new link.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
