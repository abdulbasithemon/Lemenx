"use client";

import * as React from "react";
import {
  AppWindow, Bookmark, Check, CheckSquare, ChevronDown, ChevronRight, Code,
  FileText, FileType2, GripVertical, Heading1, Heading2, Heading3, Image as ImageIcon,
  Lightbulb, List, ListOrdered, ListTree, Milestone, Minus, Music,
  Paperclip, Pencil, Plus, Quote, Sigma, Trash2, Type, Video, X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { uidClient } from "@/lib/notesClient";
import { EquationView, MEDIA_TYPES, MediaView, isSafeUrl, stripHtml } from "@/components/notes/blockShared";
import type { Block, BlockType } from "@/types/notes";

/* ═══════════════════════════════════════════════════════════════════ */
/*  Slash menu catalogue                                               */
/* ═══════════════════════════════════════════════════════════════════ */

const SLASH_ITEMS: Array<{
  type: BlockType;
  label: string;
  desc: string;
  keywords: string;
  group: "Basic" | "Media" | "Advanced";
  icon: React.ComponentType<{ className?: string }>;
}> = [
  { group: "Basic", type: "text",     label: "Text",              desc: "Plain paragraph",               keywords: "text paragraph plain", icon: Type },
  { group: "Basic", type: "page",     label: "Page",              desc: "Nested sub-page link",          keywords: "page subpage nested link", icon: FileText },
  { group: "Basic", type: "todo",     label: "To-do List",        desc: "Track tasks with checkboxes",   keywords: "todo task checkbox check", icon: CheckSquare },
  { group: "Basic", type: "bulleted", label: "Bulleted List",     desc: "Simple bullet points",          keywords: "bullet list ul", icon: List },
  { group: "Basic", type: "numbered", label: "Numbered List",     desc: "Ordered list with numbers",     keywords: "number ordered ol", icon: ListOrdered },
  { group: "Basic", type: "toggle",   label: "Toggle List",       desc: "Collapsible content",           keywords: "toggle collapse dropdown", icon: ChevronRight },
  { group: "Basic", type: "h1",       label: "Heading 1",         desc: "Big section heading",           keywords: "heading h1 title big", icon: Heading1 },
  { group: "Basic", type: "h2",       label: "Heading 2",         desc: "Medium section heading",        keywords: "heading h2 subtitle", icon: Heading2 },
  { group: "Basic", type: "h3",       label: "Heading 3",         desc: "Small section heading",         keywords: "heading h3 small", icon: Heading3 },
  { group: "Basic", type: "quote",    label: "Quote",             desc: "Capture a quotation",           keywords: "quote blockquote cite", icon: Quote },
  { group: "Basic", type: "divider",  label: "Divider",           desc: "Horizontal line",               keywords: "divider hr line separator", icon: Minus },
  { group: "Basic", type: "callout",  label: "Callout",           desc: "Highlighted note box",          keywords: "callout highlight info tip", icon: Lightbulb },
  { group: "Basic", type: "toc",      label: "Table of Contents", desc: "Links to headings in this note", keywords: "toc table contents outline", icon: ListTree },
  { group: "Basic", type: "breadcrumb", label: "Breadcrumb",      desc: "Shows this note's location",    keywords: "breadcrumb path location", icon: Milestone },

  { group: "Media", type: "image",    label: "Image",             desc: "Embed an image by URL",         keywords: "image picture photo img", icon: ImageIcon },
  { group: "Media", type: "video",    label: "Video",             desc: "YouTube or video file URL",     keywords: "video youtube movie", icon: Video },
  { group: "Media", type: "audio",    label: "Audio",             desc: "Embed an audio file",           keywords: "audio music sound mp3", icon: Music },
  { group: "Media", type: "file",     label: "File",              desc: "Link to any file",              keywords: "file attachment download", icon: Paperclip },
  { group: "Media", type: "pdf",      label: "PDF",               desc: "Embed a PDF document",          keywords: "pdf document", icon: FileType2 },
  { group: "Media", type: "bookmark", label: "Web Bookmark",      desc: "Visual link card",              keywords: "bookmark web link card url", icon: Bookmark },
  { group: "Media", type: "embed",    label: "Embed",             desc: "Embed any website (iframe)",    keywords: "embed iframe website", icon: AppWindow },

  { group: "Advanced", type: "code",     label: "Code",           desc: "Monospace code snippet",        keywords: "code snippet monospace pre", icon: Code },
  { group: "Advanced", type: "equation", label: "Equation",       desc: "LaTeX math (KaTeX)",            keywords: "equation math tex latex formula", icon: Sigma },
];

const LIST_TYPES: BlockType[] = ["todo", "bulleted", "numbered"];
/** Blocks with no editable text — Backspace on the block below removes them. */
const VOID_TYPES = new Set<BlockType>(["divider", "toc", "page", "breadcrumb", "equation", ...MEDIA_TYPES]);
const MAX_INDENT = 4;
const INDENT_PX = 24;

/* ═══════════════════════════════════════════════════════════════════ */
/*  Caret helpers (text-offset based; content may hold inline HTML)    */
/* ═══════════════════════════════════════════════════════════════════ */

function getCaretOffset(el: HTMLElement): number {
  const sel = window.getSelection();
  if (!sel || sel.rangeCount === 0) return 0;
  const range = sel.getRangeAt(0);
  const pre = range.cloneRange();
  pre.selectNodeContents(el);
  pre.setEnd(range.endContainer, range.endOffset);
  return pre.toString().length;
}

function setCaret(el: HTMLElement, offset: number) {
  el.focus();
  const sel = window.getSelection();
  if (!sel) return;
  const range = document.createRange();
  let remaining = offset;
  const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
  let node: Node | null;
  while ((node = walker.nextNode())) {
    const len = node.textContent?.length ?? 0;
    if (remaining <= len) {
      range.setStart(node, remaining);
      range.collapse(true);
      sel.removeAllRanges();
      sel.addRange(range);
      return;
    }
    remaining -= len;
  }
  range.selectNodeContents(el);
  range.collapse(false);
  sel.removeAllRanges();
  sel.addRange(range);
}

/** Split the element's (possibly formatted) content at the caret. */
function splitAtCaret(el: HTMLElement): { before: string; after: string } {
  const sel = window.getSelection();
  if (!sel || sel.rangeCount === 0) return { before: el.innerHTML, after: "" };
  const range = sel.getRangeAt(0);
  const post = document.createRange();
  post.selectNodeContents(el);
  post.setStart(range.endContainer, range.endOffset);
  const frag = post.extractContents(); // mutates el: removes the tail
  const div = document.createElement("div");
  div.appendChild(frag);
  return { before: el.innerHTML, after: div.innerHTML };
}

const normalizeHtml = (html: string) => (html === "<br>" || html === "<div><br></div>" ? "" : html);

/* ═══════════════════════════════════════════════════════════════════ */
/*  Editable rich-text div                                             */
/* ═══════════════════════════════════════════════════════════════════ */

const EditableText = React.forwardRef<HTMLDivElement, {
  value: string;
  placeholder: string;
  focusPlaceholder?: boolean;
  className?: string;
  onInput: (html: string) => void;
  onKeyDown: (e: React.KeyboardEvent<HTMLDivElement>) => void;
}>(function EditableText({ value, placeholder, focusPlaceholder, className, onInput, onKeyDown }, fwd) {
  const inner = React.useRef<HTMLDivElement | null>(null);

  React.useEffect(() => {
    const el = inner.current;
    if (el && normalizeHtml(el.innerHTML) !== value) el.innerHTML = value;
  }, [value]);

  return (
    <div
      ref={(el) => {
        inner.current = el;
        if (typeof fwd === "function") fwd(el);
        else if (fwd) fwd.current = el;
      }}
      contentEditable
      suppressContentEditableWarning
      data-placeholder={placeholder}
      className={cn(
        "note-prose min-h-[1.6em] flex-1 whitespace-pre-wrap break-words outline-none",
        focusPlaceholder ? "block-placeholder-focus" : "block-placeholder",
        className
      )}
      onInput={(e) => onInput(normalizeHtml((e.target as HTMLElement).innerHTML))}
      onKeyDown={onKeyDown}
    />
  );
});

/* ═══════════════════════════════════════════════════════════════════ */
/*  Visibility & numbering                                             */
/* ═══════════════════════════════════════════════════════════════════ */

function visibleBlocks(blocks: Block[]): Block[] {
  const out: Block[] = [];
  let hideDeeperThan: number | null = null;
  for (const b of blocks) {
    if (hideDeeperThan !== null) {
      if (b.indent > hideDeeperThan) continue;
      hideDeeperThan = null;
    }
    out.push(b);
    if (b.type === "toggle" && b.collapsed) hideDeeperThan = b.indent;
  }
  return out;
}

function numberFor(blocks: Block[], index: number): number {
  const target = blocks[index];
  let n = 1;
  for (let i = index - 1; i >= 0; i--) {
    const b = blocks[i];
    if (b.indent < target.indent) break;
    if (b.indent === target.indent) {
      if (b.type !== "numbered") break;
      n++;
    }
  }
  return n;
}

/* ═══════════════════════════════════════════════════════════════════ */
/*  Media & equation editor sub-components                             */
/* ═══════════════════════════════════════════════════════════════════ */

function MediaBlockEditor({
  block,
  onSetUrl,
  onRemove,
}: {
  block: Block;
  onSetUrl: (url: string) => void;
  onRemove: () => void;
}) {
  const [draft, setDraft] = React.useState("");
  const item = SLASH_ITEMS.find((i) => i.type === block.type);
  const Icon = item?.icon ?? Paperclip;

  if (!isSafeUrl(block.url)) {
    return (
      <div className="flex flex-1 items-center gap-2 rounded-lg border border-dashed border-border bg-muted/30 p-3">
        <Icon className="h-4 w-4 shrink-0 text-muted-foreground" />
        <input
          autoFocus
          className="min-w-0 flex-1 bg-transparent text-sm placeholder:text-muted-foreground focus:outline-none"
          placeholder={`Paste ${item?.label ?? "media"} URL (https://…) and press Enter`}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && isSafeUrl(draft)) onSetUrl(draft.trim());
          }}
        />
        <button
          className="rounded bg-primary px-2.5 py-1 text-xs font-medium text-primary-foreground disabled:opacity-50"
          disabled={!isSafeUrl(draft)}
          onClick={() => onSetUrl(draft.trim())}
        >
          Embed
        </button>
        <button className="rounded p-1 text-muted-foreground hover:bg-muted" onClick={onRemove} title="Remove block">
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
    );
  }

  return (
    <div className="group/media relative flex-1">
      <MediaView block={block} />
      <div className="absolute right-2 top-2 flex gap-1 opacity-0 transition-opacity group-hover/media:opacity-100">
        <button
          className="rounded bg-background/90 p-1.5 shadow hover:bg-muted"
          title="Change URL"
          onClick={() => onSetUrl("")}
        >
          <Pencil className="h-3.5 w-3.5" />
        </button>
        <button
          className="rounded bg-background/90 p-1.5 text-destructive shadow hover:bg-destructive/10"
          title="Delete block"
          onClick={onRemove}
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}

function EquationBlockEditor({
  block,
  onSave,
  onRemove,
}: {
  block: Block;
  onSave: (tex: string) => void;
  onRemove: () => void;
}) {
  const [editing, setEditing] = React.useState(!block.content);
  const [draft, setDraft] = React.useState(block.content);

  if (!editing) {
    return (
      <button
        className="group/eq relative flex-1 rounded-lg px-2 hover:bg-muted/50"
        onClick={() => { setDraft(block.content); setEditing(true); }}
        title="Click to edit"
      >
        <EquationView tex={block.content} />
      </button>
    );
  }

  return (
    <div className="flex-1 rounded-lg border border-border bg-muted/30 p-3">
      <textarea
        autoFocus
        rows={2}
        className="w-full resize-y rounded border border-input bg-background p-2 font-mono text-[13px] focus:outline-none focus:ring-1 focus:ring-ring"
        placeholder="LaTeX, e.g.  \frac{a}{b} = \sqrt{c^2 + d^2}"
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) { onSave(draft); setEditing(false); }
          if (e.key === "Escape") setEditing(false);
        }}
      />
      <div className="mt-2 rounded bg-background p-2">
        <EquationView tex={draft} />
      </div>
      <div className="mt-2 flex justify-between">
        <button className="rounded p-1 text-destructive hover:bg-destructive/10" onClick={onRemove} title="Delete">
          <Trash2 className="h-3.5 w-3.5" />
        </button>
        <div className="flex gap-2">
          <button className="rounded border border-border px-2.5 py-1 text-xs hover:bg-muted" onClick={() => setEditing(false)}>
            Cancel
          </button>
          <button
            className="rounded bg-primary px-2.5 py-1 text-xs font-medium text-primary-foreground"
            onClick={() => { onSave(draft); setEditing(false); }}
          >
            Done (⌘+Enter)
          </button>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════ */
/*  BlockEditor                                                        */
/* ═══════════════════════════════════════════════════════════════════ */

export interface BlockEditorProps {
  blocks: Block[];
  onChange: (blocks: Block[]) => void;
  noteTitles: Record<string, { title: string; icon?: string }>;
  onCreateSubpage: () => Promise<{ id: string; title: string }>;
  onOpenNote: (id: string) => void;
  /** "Category / Section / Note" text used by breadcrumb blocks. */
  breadcrumb?: string;
}

interface SlashState {
  blockId: string;
  anchor: number;
  query: string;
  index: number;
}

export function BlockEditor({
  blocks: rawBlocks, onChange, noteTitles, onCreateSubpage, onOpenNote, breadcrumb,
}: BlockEditorProps) {
  const blocks = React.useMemo(
    () => (Array.isArray(rawBlocks) ? rawBlocks : []),
    [rawBlocks]
  );
  const refs = React.useRef<Record<string, HTMLDivElement | null>>({});
  const pendingFocus = React.useRef<{ id: string; offset: number | "end" } | null>(null);
  const [slash, setSlash] = React.useState<SlashState | null>(null);
  const [dragId, setDragId] = React.useState<string | null>(null);
  const [dropId, setDropId] = React.useState<string | null>(null);

  React.useLayoutEffect(() => {
    const p = pendingFocus.current;
    if (!p) return;
    const el = refs.current[p.id];
    if (el) {
      setCaret(el, p.offset === "end" ? (el.textContent ?? "").length : p.offset);
      pendingFocus.current = null;
    }
  }, [blocks]);

  const idx = (id: string) => blocks.findIndex((b) => b.id === id);
  const patchBlock = (id: string, patch: Partial<Block>) =>
    onChange(blocks.map((b) => (b.id === id ? { ...b, ...patch } : b)));
  const insertAfter = (id: string, block: Block) => {
    const i = idx(id);
    const next = [...blocks];
    next.splice(i + 1, 0, block);
    onChange(next);
  };
  const removeBlock = (id: string) => onChange(blocks.filter((b) => b.id !== id));
  const newBlock = (type: BlockType = "text", indent = 0, content = ""): Block => ({
    id: uidClient(), type, content, indent,
  });

  /* ── slash menu ──────────────────────────────────────── */

  const filteredItems = slash
    ? SLASH_ITEMS.filter((it) =>
        (it.label + " " + it.keywords).toLowerCase().includes(slash.query.toLowerCase())
      )
    : [];

  const applySlashSelection = async (block: Block, item: (typeof SLASH_ITEMS)[number]) => {
    const anchor = slash?.anchor ?? 0;
    setSlash(null);
    // Strip the "/query" — safe on plain text; formatted content just resets.
    const plain = stripHtml(block.content);
    const stripped = block.content.includes("<") ? "" : plain.slice(0, anchor);

    if (item.type === "page") {
      const page = await onCreateSubpage();
      onChange(blocks.map((b) =>
        b.id === block.id
          ? { ...b, type: "page" as BlockType, content: page.title, linkedNoteId: page.id }
          : b
      ));
      return;
    }

    const content =
      item.type === "breadcrumb" ? (breadcrumb ?? "")
      : ["divider", "toc", "equation", ...MEDIA_TYPES].includes(item.type) ? ""
      : stripped;

    if (!VOID_TYPES.has(item.type) && item.type !== "code") {
      pendingFocus.current = { id: block.id, offset: "end" };
    }
    onChange(blocks.map((b) =>
      b.id === block.id ? { ...b, type: item.type, content, url: undefined } : b
    ));
  };

  /* ── key handling ────────────────────────────────────── */

  const handleKeyDown = (block: Block, e: React.KeyboardEvent<HTMLDivElement>) => {
    const el = refs.current[block.id];
    if (!el) return;
    const mod = e.metaKey || e.ctrlKey;

    /* Inline formatting shortcuts (browser handles ⌘B/⌘I/⌘U natively) */
    if (mod && e.shiftKey && e.key.toLowerCase() === "s") {
      e.preventDefault();
      document.execCommand("strikeThrough");
      patchBlock(block.id, { content: normalizeHtml(el.innerHTML) });
      return;
    }
    if (mod && !e.shiftKey && e.key.toLowerCase() === "e") {
      e.preventDefault();
      const sel = window.getSelection();
      if (sel && sel.rangeCount && !sel.isCollapsed) {
        const range = sel.getRangeAt(0);
        const code = document.createElement("code");
        try {
          range.surroundContents(code);
          patchBlock(block.id, { content: normalizeHtml(el.innerHTML) });
        } catch { /* selection crosses element boundaries — skip */ }
      }
      return;
    }
    if (mod && !e.shiftKey && e.key.toLowerCase() === "k") {
      e.preventDefault();
      const sel = window.getSelection();
      if (sel && sel.rangeCount && !sel.isCollapsed) {
        const url = window.prompt("Link URL (https://…)");
        if (url && /^https?:\/\//i.test(url)) {
          document.execCommand("createLink", false, url);
          patchBlock(block.id, { content: normalizeHtml(el.innerHTML) });
        }
      }
      return;
    }

    /* Slash menu capture */
    if (slash && slash.blockId === block.id) {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setSlash({ ...slash, index: (slash.index + 1) % Math.max(filteredItems.length, 1) });
        return;
      }
      if (e.key === "ArrowUp") {
        e.preventDefault();
        setSlash({ ...slash, index: (slash.index - 1 + Math.max(filteredItems.length, 1)) % Math.max(filteredItems.length, 1) });
        return;
      }
      if (e.key === "Enter") {
        e.preventDefault();
        const item = filteredItems[slash.index] ?? filteredItems[0];
        if (item) void applySlashSelection(block, item);
        return;
      }
      if (e.key === "Escape") {
        e.preventDefault();
        setSlash(null);
        return;
      }
    }

    if (e.key === "/" && !slash) {
      setSlash({ blockId: block.id, anchor: getCaretOffset(el), query: "", index: 0 });
      return;
    }

    /* Code block: Enter = newline, Shift+Enter = exit below */
    if (e.key === "Enter" && block.type === "code") {
      e.preventDefault();
      if (e.shiftKey) {
        const nb = newBlock("text", block.indent);
        pendingFocus.current = { id: nb.id, offset: 0 };
        insertAfter(block.id, nb);
      } else {
        document.execCommand("insertText", false, "\n");
      }
      return;
    }

    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();

      if (LIST_TYPES.includes(block.type) && !stripHtml(block.content).trim()) {
        pendingFocus.current = { id: block.id, offset: 0 };
        patchBlock(block.id, { type: "text" });
        return;
      }

      const { before, after } = splitAtCaret(el);
      const continuation: BlockType = LIST_TYPES.includes(block.type) ? block.type : "text";
      const childIndent = block.type === "toggle" && !block.collapsed
        ? Math.min(block.indent + 1, MAX_INDENT)
        : block.indent;
      const nb = newBlock(continuation, childIndent, normalizeHtml(after));
      pendingFocus.current = { id: nb.id, offset: 0 };
      const i = idx(block.id);
      const next = blocks.map((b) => (b.id === block.id ? { ...b, content: normalizeHtml(before) } : b));
      next.splice(i + 1, 0, nb);
      onChange(next);
      return;
    }

    if (e.key === "Tab") {
      e.preventDefault();
      const delta = e.shiftKey ? -1 : 1;
      pendingFocus.current = { id: block.id, offset: getCaretOffset(el) };
      patchBlock(block.id, { indent: Math.max(0, Math.min(MAX_INDENT, block.indent + delta)) });
      return;
    }

    if (e.key === "Backspace" && getCaretOffset(el) === 0 && window.getSelection()?.isCollapsed) {
      if (block.type !== "text") {
        e.preventDefault();
        pendingFocus.current = { id: block.id, offset: 0 };
        patchBlock(block.id, { type: "text" });
        return;
      }
      if (block.indent > 0) {
        e.preventDefault();
        pendingFocus.current = { id: block.id, offset: 0 };
        patchBlock(block.id, { indent: block.indent - 1 });
        return;
      }
      const shown = visibleBlocks(blocks);
      const vi = shown.findIndex((b) => b.id === block.id);
      if (vi > 0) {
        e.preventDefault();
        const prev = shown[vi - 1];
        if (VOID_TYPES.has(prev.type)) {
          onChange(blocks.filter((b) => b.id !== prev.id));
          pendingFocus.current = { id: block.id, offset: 0 };
          return;
        }
        const junction = stripHtml(prev.content).length;
        pendingFocus.current = { id: prev.id, offset: junction };
        onChange(
          blocks
            .map((b) => (b.id === prev.id ? { ...b, content: b.content + block.content } : b))
            .filter((b) => b.id !== block.id)
        );
      }
      return;
    }

    if (!slash && (e.key === "ArrowUp" || e.key === "ArrowDown")) {
      const offset = getCaretOffset(el);
      const plainLen = stripHtml(block.content).length;
      const shown = visibleBlocks(blocks);
      const vi = shown.findIndex((b) => b.id === block.id);
      if (e.key === "ArrowUp" && offset === 0 && vi > 0) {
        const prevEl = refs.current[shown[vi - 1].id];
        if (prevEl) { e.preventDefault(); setCaret(prevEl, (prevEl.textContent ?? "").length); }
      }
      if (e.key === "ArrowDown" && offset >= plainLen && vi < shown.length - 1) {
        const nextEl = refs.current[shown[vi + 1].id];
        if (nextEl) { e.preventDefault(); setCaret(nextEl, 0); }
      }
    }
  };

  const handleInput = (block: Block, html: string) => {
    patchBlock(block.id, { content: html });
    if (slash && slash.blockId === block.id) {
      const el = refs.current[block.id];
      const plain = el?.textContent ?? stripHtml(html);
      const after = plain.slice(slash.anchor);
      if (!after.startsWith("/")) setSlash(null);
      else setSlash({ ...slash, query: after.slice(1), index: 0 });
    }
  };

  /* ── drag & drop ─────────────────────────────────────── */

  const handleDrop = (targetId: string) => {
    if (!dragId || dragId === targetId) { setDragId(null); setDropId(null); return; }
    const from = idx(dragId);
    const next = [...blocks];
    const [moved] = next.splice(from, 1);
    const to = next.findIndex((b) => b.id === targetId);
    next.splice(to + 1, 0, moved);
    onChange(next);
    setDragId(null);
    setDropId(null);
  };

  /* ── render ──────────────────────────────────────────── */

  const shown = visibleBlocks(blocks);
  const headings = blocks.filter((b) => ["h1", "h2", "h3"].includes(b.type) && stripHtml(b.content).trim());

  return (
    <div className="pb-32" onClick={(e) => {
      if (e.target === e.currentTarget) {
        const nb = newBlock();
        pendingFocus.current = { id: nb.id, offset: 0 };
        onChange([...blocks, nb]);
      }
    }}>
      {shown.map((block) => {
        const style = { marginLeft: block.indent * INDENT_PX };
        const isSlashHere = slash?.blockId === block.id;
        const common = {
          value: block.content,
          onInput: (t: string) => handleInput(block, t),
          onKeyDown: (e: React.KeyboardEvent<HTMLDivElement>) => handleKeyDown(block, e),
        };
        const refCb = (el: HTMLDivElement | null) => { refs.current[block.id] = el; };

        let body: React.ReactNode;
        if (MEDIA_TYPES.includes(block.type)) {
          body = (
            <MediaBlockEditor
              block={block}
              onSetUrl={(url) => patchBlock(block.id, { url: url || undefined })}
              onRemove={() => removeBlock(block.id)}
            />
          );
        } else {
          switch (block.type) {
            case "h1":
              body = <EditableText ref={refCb} {...common} placeholder="Heading 1" className="pt-4 text-3xl font-bold" />;
              break;
            case "h2":
              body = <EditableText ref={refCb} {...common} placeholder="Heading 2" className="pt-3 text-2xl font-semibold" />;
              break;
            case "h3":
              body = <EditableText ref={refCb} {...common} placeholder="Heading 3" className="pt-2 text-xl font-semibold" />;
              break;
            case "todo":
              body = (
                <div className="flex flex-1 items-start gap-2">
                  <button
                    className={cn(
                      "mt-1 flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded border transition-colors",
                      block.checked ? "border-primary bg-primary text-primary-foreground" : "border-muted-foreground hover:border-primary"
                    )}
                    onClick={() => patchBlock(block.id, { checked: !block.checked })}
                  >
                    {block.checked && <Check className="h-3 w-3" />}
                  </button>
                  <EditableText
                    ref={refCb} {...common} placeholder="To-do"
                    className={cn("text-[15px]", block.checked && "text-muted-foreground line-through")}
                  />
                </div>
              );
              break;
            case "bulleted":
              body = (
                <div className="flex flex-1 items-start gap-2">
                  <span className="mt-[11px] h-1.5 w-1.5 shrink-0 rounded-full bg-foreground" />
                  <EditableText ref={refCb} {...common} placeholder="List item" className="text-[15px]" />
                </div>
              );
              break;
            case "numbered":
              body = (
                <div className="flex flex-1 items-start gap-2">
                  <span className="mt-0.5 w-5 shrink-0 text-right text-[15px] tabular-nums">
                    {numberFor(blocks, idx(block.id))}.
                  </span>
                  <EditableText ref={refCb} {...common} placeholder="List item" className="text-[15px]" />
                </div>
              );
              break;
            case "toggle":
              body = (
                <div className="flex flex-1 items-start gap-1">
                  <button
                    className="mt-0.5 rounded p-0.5 hover:bg-muted"
                    onClick={() => patchBlock(block.id, { collapsed: !block.collapsed })}
                  >
                    {block.collapsed
                      ? <ChevronRight className="h-4 w-4 text-muted-foreground" />
                      : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
                  </button>
                  <EditableText ref={refCb} {...common} placeholder="Toggle" className="text-[15px] font-medium" />
                </div>
              );
              break;
            case "quote":
              body = (
                <blockquote className="flex-1 border-l-[3px] border-foreground pl-4">
                  <EditableText ref={refCb} {...common} placeholder="Quote" className="text-[15px] italic" />
                </blockquote>
              );
              break;
            case "divider":
              body = (
                <div
                  tabIndex={0}
                  ref={refCb as React.Ref<HTMLDivElement>}
                  className="flex-1 cursor-default rounded py-2 outline-none focus:ring-1 focus:ring-ring"
                  onKeyDown={(e) => {
                    if (e.key === "Backspace" || e.key === "Delete") removeBlock(block.id);
                  }}
                >
                  <hr className="border-border" />
                </div>
              );
              break;
            case "callout":
              body = (
                <div className="flex flex-1 items-start gap-3 rounded-lg bg-muted p-4">
                  <Lightbulb className="mt-0.5 h-5 w-5 shrink-0 text-amber-500" />
                  <EditableText ref={refCb} {...common} placeholder="Callout" className="text-[15px]" />
                </div>
              );
              break;
            case "code":
              body = (
                <div className="flex-1 rounded-lg bg-zinc-950 px-4 py-3 dark:bg-zinc-900">
                  <EditableText
                    ref={refCb} {...common} placeholder="Write some code…"
                    className="font-mono text-[13px] leading-relaxed text-zinc-100"
                  />
                </div>
              );
              break;
            case "equation":
              body = (
                <EquationBlockEditor
                  block={block}
                  onSave={(tex) => patchBlock(block.id, { content: tex })}
                  onRemove={() => removeBlock(block.id)}
                />
              );
              break;
            case "breadcrumb":
              body = (
                <div className="flex flex-1 items-center gap-1 py-1 text-sm text-muted-foreground">
                  {(block.content || breadcrumb || "").split(" / ").map((part, i, arr) => (
                    <React.Fragment key={i}>
                      <span className={cn(i === arr.length - 1 && "font-medium text-foreground")}>{part}</span>
                      {i < arr.length - 1 && <ChevronRight className="h-3.5 w-3.5" />}
                    </React.Fragment>
                  ))}
                </div>
              );
              break;
            case "toc":
              body = (
                <div className="flex-1 rounded-lg border border-border p-4">
                  <p className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    <ListTree className="h-3.5 w-3.5" /> Table of contents
                  </p>
                  {headings.length === 0 ? (
                    <p className="text-sm text-muted-foreground">Add headings and they&apos;ll show up here.</p>
                  ) : (
                    <div className="space-y-1">
                      {headings.map((h) => (
                        <button
                          key={h.id}
                          className={cn(
                            "block text-left text-sm text-primary hover:underline",
                            h.type === "h2" && "pl-4",
                            h.type === "h3" && "pl-8"
                          )}
                          onClick={() => refs.current[h.id]?.scrollIntoView({ behavior: "smooth", block: "center" })}
                        >
                          {stripHtml(h.content)}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              );
              break;
            case "page": {
              const linked = block.linkedNoteId ? noteTitles[block.linkedNoteId] : undefined;
              body = (
                <button
                  className="flex flex-1 items-center gap-2 rounded-lg px-2 py-1.5 text-left text-[15px] hover:bg-muted"
                  onClick={() => block.linkedNoteId && onOpenNote(block.linkedNoteId)}
                >
                  <span className="text-base">{linked?.icon ?? "📄"}</span>
                  <span className="font-medium underline decoration-muted-foreground/40">
                    {linked?.title ?? stripHtml(block.content) ?? "Untitled"}
                  </span>
                </button>
              );
              break;
            }
            default:
              body = (
                <EditableText
                  ref={refCb} {...common}
                  placeholder="Type '/' for commands"
                  focusPlaceholder
                  className="text-[15px]"
                />
              );
          }
        }

        return (
          <div
            key={block.id}
            style={style}
            className={cn(
              "group relative flex items-start gap-0.5 rounded px-1 py-0.5",
              dropId === block.id && "border-b-2 border-primary",
              dragId === block.id && "opacity-40"
            )}
            onDragOver={(e) => { e.preventDefault(); setDropId(block.id); }}
            onDragLeave={() => setDropId((d) => (d === block.id ? null : d))}
            onDrop={() => handleDrop(block.id)}
          >
            <div className="flex shrink-0 items-center gap-0 pt-1 opacity-0 transition-opacity group-hover:opacity-100">
              <button
                className="rounded p-0.5 text-muted-foreground hover:bg-muted"
                title="Add block below"
                onClick={() => {
                  const nb = newBlock("text", block.indent);
                  pendingFocus.current = { id: nb.id, offset: 0 };
                  insertAfter(block.id, nb);
                }}
              >
                <Plus className="h-4 w-4" />
              </button>
              <span
                draggable
                className="cursor-grab rounded p-0.5 text-muted-foreground hover:bg-muted active:cursor-grabbing"
                title="Drag to reorder"
                onDragStart={(e) => {
                  setDragId(block.id);
                  e.dataTransfer.effectAllowed = "move";
                }}
                onDragEnd={() => { setDragId(null); setDropId(null); }}
              >
                <GripVertical className="h-4 w-4" />
              </span>
            </div>

            {body}

            {isSlashHere && filteredItems.length > 0 && (
              <div className="absolute left-10 top-full z-50 mt-1 max-h-80 w-80 overflow-y-auto rounded-xl border border-border bg-card p-1 shadow-xl">
                {(["Basic", "Media", "Advanced"] as const).map((grp) => {
                  const items = filteredItems.filter((i) => i.group === grp);
                  if (items.length === 0) return null;
                  return (
                    <div key={grp}>
                      <p className="px-3 pb-1 pt-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                        {grp === "Basic" ? "Basic blocks" : grp === "Media" ? "Media" : "Advanced"}
                      </p>
                      {items.map((item) => {
                        const gi = filteredItems.indexOf(item);
                        const Icon = item.icon;
                        return (
                          <button
                            key={item.type}
                            className={cn(
                              "flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left",
                              gi === slash!.index ? "bg-muted" : "hover:bg-muted/60"
                            )}
                            onMouseEnter={() => setSlash((s) => (s ? { ...s, index: gi } : s))}
                            onMouseDown={(e) => {
                              e.preventDefault();
                              void applySlashSelection(block, item);
                            }}
                          >
                            <span className="flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-background">
                              <Icon className="h-4 w-4" />
                            </span>
                            <span>
                              <span className="block text-sm font-medium">{item.label}</span>
                              <span className="block text-xs text-muted-foreground">{item.desc}</span>
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}

      <button
        className="mt-2 flex w-full items-center gap-2 rounded px-2 py-1.5 text-sm text-muted-foreground/60 hover:bg-muted/40 hover:text-muted-foreground"
        onClick={() => {
          const nb = newBlock();
          pendingFocus.current = { id: nb.id, offset: 0 };
          onChange([...blocks, nb]);
        }}
      >
        <Plus className="h-4 w-4" /> Click to add a block
      </button>

      {/* Shortcuts hint */}
      <p className="mt-6 flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-muted-foreground/60">
        <span><kbd>/</kbd> blocks</span>
        <span><kbd>⌘B</kbd> bold</span>
        <span><kbd>⌘I</kbd> italic</span>
        <span><kbd>⌘U</kbd> underline</span>
        <span><kbd>⌘⇧S</kbd> strikethrough</span>
        <span><kbd>⌘E</kbd> inline code</span>
        <span><kbd>⌘K</kbd> link</span>
        <span><kbd>Tab</kbd> indent</span>
      </p>
    </div>
  );
}
