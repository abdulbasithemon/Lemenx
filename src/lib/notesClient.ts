"use client";

import type { NotesTreeData } from "@/types/notes";

/** Client-side helpers shared by the notes UI. */

/** Never trust the tree response shape — missing arrays become empty ones. */
export function normalizeTree(raw: Partial<NotesTreeData> | null | undefined): NotesTreeData {
  return {
    categories: Array.isArray(raw?.categories) ? raw!.categories : [],
    groups: Array.isArray(raw?.groups) ? raw!.groups : [],
    notes: Array.isArray(raw?.notes) ? raw!.notes : [],
  };
}

export function uidClient() {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4);
}

/** Notify listeners (e.g. the sidebar tree) that notes data changed. */
export function emitNotesChanged() {
  window.dispatchEvent(new CustomEvent("lemenx:notes-changed"));
}

export function onNotesChanged(handler: () => void) {
  window.addEventListener("lemenx:notes-changed", handler);
  return () => window.removeEventListener("lemenx:notes-changed", handler);
}
