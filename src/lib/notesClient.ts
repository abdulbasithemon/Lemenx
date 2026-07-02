"use client";

/** Client-side helpers shared by the notes UI. */

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
