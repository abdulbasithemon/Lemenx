"use client";

import * as React from "react";
import katex from "katex";
import { Bookmark, ExternalLink, FileText, Paperclip } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Block, BlockType } from "@/types/notes";

/* ── plain-text helpers ──────────────────────────────────── */

export function stripHtml(html: string): string {
  return (html ?? "").replace(/<[^>]*>/g, "");
}

/** Allowlist sanitizer for the limited inline formatting we support. */
const ALLOWED_TAGS = new Set(["B", "STRONG", "I", "EM", "U", "S", "STRIKE", "DEL", "CODE", "A", "BR", "SPAN", "FONT"]);

export function sanitizeHtml(html: string): string {
  if (!html) return "";
  if (typeof window === "undefined") return stripHtml(html);
  const doc = new DOMParser().parseFromString(`<div>${html}</div>`, "text/html");
  const root = doc.body.firstElementChild as HTMLElement;

  const clean = (parent: Element) => {
    for (const el of Array.from(parent.children)) {
      clean(el);
      if (!ALLOWED_TAGS.has(el.tagName)) {
        while (el.firstChild) parent.insertBefore(el.firstChild, el);
        el.remove();
        continue;
      }
      for (const attr of Array.from(el.attributes)) {
        const keepHref =
          el.tagName === "A" &&
          attr.name === "href" &&
          /^(https?:|mailto:|\/)/i.test(attr.value.trim());
        if (!keepHref) el.removeAttribute(attr.name);
      }
      if (el.tagName === "A") {
        el.setAttribute("target", "_blank");
        el.setAttribute("rel", "noopener noreferrer");
      }
    }
  };
  clean(root);
  return root.innerHTML;
}

export function isSafeUrl(url?: string): url is string {
  return typeof url === "string" && /^https?:\/\//i.test(url.trim());
}

/* ── media ───────────────────────────────────────────────── */

export const MEDIA_TYPES: BlockType[] = ["image", "video", "audio", "file", "pdf", "bookmark", "embed"];

function youtubeEmbed(url: string): string | null {
  const m =
    url.match(/youtube\.com\/watch\?v=([\w-]{6,})/) ??
    url.match(/youtu\.be\/([\w-]{6,})/) ??
    url.match(/youtube\.com\/shorts\/([\w-]{6,})/);
  return m ? `https://www.youtube.com/embed/${m[1]}` : null;
}

function fileNameFromUrl(url: string): string {
  try {
    const p = new URL(url).pathname;
    return decodeURIComponent(p.split("/").filter(Boolean).pop() ?? url);
  } catch {
    return url;
  }
}

/** Read-only rendering of a media block (shared by editor preview & share page). */
export function MediaView({ block }: { block: Block }) {
  const url = block.url;
  if (!isSafeUrl(url)) {
    return (
      <div className="rounded-lg border border-dashed border-border p-4 text-sm text-muted-foreground">
        No media URL set.
      </div>
    );
  }

  switch (block.type) {
    case "image":
      // eslint-disable-next-line @next/next/no-img-element
      return <img src={url} alt={stripHtml(block.content) || "image"} className="max-h-[480px] rounded-lg border border-border object-contain" />;
    case "video": {
      const yt = youtubeEmbed(url);
      if (yt) {
        return (
          <div className="aspect-video w-full overflow-hidden rounded-lg border border-border">
            <iframe src={yt} className="h-full w-full" allowFullScreen title="video" />
          </div>
        );
      }
      return <video src={url} controls className="max-h-[480px] w-full rounded-lg border border-border" />;
    }
    case "audio":
      return <audio src={url} controls className="w-full" />;
    case "pdf":
      return (
        <div className="overflow-hidden rounded-lg border border-border">
          <iframe src={url} className="h-96 w-full" title="pdf" />
          <a href={url} target="_blank" rel="noreferrer" className="flex items-center gap-2 border-t border-border bg-muted/40 px-3 py-2 text-xs text-muted-foreground hover:text-foreground">
            <FileText className="h-3.5 w-3.5" /> Open PDF <ExternalLink className="h-3 w-3" />
          </a>
        </div>
      );
    case "file":
      return (
        <a href={url} target="_blank" rel="noreferrer" className="flex items-center gap-3 rounded-lg border border-border p-3 hover:bg-muted/50">
          <Paperclip className="h-4 w-4 shrink-0 text-muted-foreground" />
          <span className="min-w-0 flex-1 truncate text-sm font-medium">{fileNameFromUrl(url)}</span>
          <ExternalLink className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
        </a>
      );
    case "bookmark":
      return (
        <a href={url} target="_blank" rel="noreferrer" className="flex items-center gap-3 rounded-lg border border-border p-3 hover:bg-muted/50">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={`https://www.google.com/s2/favicons?sz=32&domain_url=${encodeURIComponent(url)}`}
            alt=""
            className="h-6 w-6 shrink-0 rounded"
          />
          <span className="min-w-0 flex-1">
            <span className="block truncate text-sm font-medium">{stripHtml(block.content) || fileNameFromUrl(url)}</span>
            <span className="block truncate text-xs text-muted-foreground">{url}</span>
          </span>
          <Bookmark className="h-4 w-4 shrink-0 text-muted-foreground" />
        </a>
      );
    case "embed":
      return (
        <div className="overflow-hidden rounded-lg border border-border">
          <iframe src={url} className="h-96 w-full" title="embed" />
        </div>
      );
    default:
      return null;
  }
}

/* ── equation ────────────────────────────────────────────── */

export function EquationView({ tex, className }: { tex: string; className?: string }) {
  const html = React.useMemo(() => {
    try {
      return katex.renderToString(tex || "\\text{empty equation}", {
        displayMode: true,
        throwOnError: false,
      });
    } catch {
      return "";
    }
  }, [tex]);
  return (
    <div
      className={cn("overflow-x-auto py-1 text-center", className)}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
