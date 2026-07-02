"use client";

import * as React from "react";
import {
  Check, CheckSquare, ChevronDown, ChevronRight, FileText, GripVertical,
  Heading1, Heading2, Heading3, Lightbulb, List, ListOrdered, ListTree,
  Minus, Plus, Quote, Type,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { uidClient } from "@/lib/notesClient";
import type { Block, BlockType } from "@/types/notes";

/* ═══════════════════════════════════════════════════════════════════ */
/*  Slash menu catalogue                                               */
/* ═══════════════════════════════════════════════════════════════════ */

const SLASH_ITEMS: Array<{
  type: BlockType;
  label: string;
  desc: string;
  keywords: string;
  icon: React.ComponentType<{ className?: string }>;
}> = [
  { type: "text",     label: "Text",              desc: "Plain paragraph",              keywords: "text paragraph plain", icon: Type },
  { type: "todo",     label: "To-do List",        desc: "Track tasks with checkboxes",  keywords: "todo task checkbox check", icon: CheckSquare },
  { type: "bulleted", label: "Bulleted List",     desc: "Simple bullet points",         keywords: "bullet list ul", icon: List },
  { type: "numbered", label: "Numbered List",     desc: "Ordered list with numbers",    keywords: "number ordered ol", icon: ListOrdered },
  { type: "toggle",   label: "Toggle List",       desc: "Collapsible content",          keywords: "toggle collapse dropdown", icon: ChevronRight },
  { type: "h1",       label: "Heading 1",         desc: "Big section heading",          keywords: "heading h1 title big", icon: Heading1 },
  { type: "h2",       label: "Heading 2",         desc: "Medium section heading",       keywords: "heading h2 subtitle", icon: Heading2 },
  { type: "h3",       label: "Heading 3",         desc: "Small section heading",        keywords: "heading h3 small", icon: Heading3 },
  { type: "quote",    label: "Quote",             desc: "Capture a quotation",          keywords: "quote blockquote cite", icon: Quote },
  { type: "divider",  label: "Divider",           desc: "Horizontal line",              keywords: "divider hr line separator", icon: Minus },
  { type: "callout",  label: "Callout",           desc: "Highlighted note box",         keywords: "callout highlight info tip", icon: Lightbulb },
  { type: "toc",      label: "Table of Contents", desc: "Links to headings in this note", keywords: "toc table contents outline", icon: ListTree },
  { type: "page",     label: "Page",              desc: "Nested sub-page link",         keywords: "page subpage nested link", icon: FileText },
];

const LIST_TYPES: BlockType[] = ["todo", "bulleted", "numbered"];
const MAX_INDENT = 4;
const INDENT_PX = 24;

/* ═══════════════════════════════════════════════════════════════════ */
/*  Caret helpers                                                      */
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

/* ═══════════════════════════════════════════════════════════════════ */
/*  Editable text div (uncontrolled contentEditable, state-synced)     */
/* ═══════════════════════════════════════════════════════════════════ */

const EditableText = React.forwardRef<HTMLDivElement, {
  value: string;
  placeholder: string;
  focusPlaceholder?: boolean;
  className?: string;
  onInput: (text: string) => void;
  onKeyDown: (e: React.KeyboardEvent<HTMLDivElement>) => void;
}>(function EditableText({ value, placeholder, focusPlaceholder, className, onInput, onKeyDown }, fwd) {
  const inner = React.useRef<HTMLDivElement | null>(null);

  React.useEffect(() => {
    const el = inner.current;
    if (el && el.textContent !== value) el.textContent = value;
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
        "min-h-[1.6em] flex-1 whitespace-pre-wrap break-words outline-none",
        focusPlaceholder ? "block-placeholder-focus" : "block-placeholder",
        className
      )}
      onInput={(e) => onInput((e.target as HTMLElement).textContent ?? "")}
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
/*  BlockEditor                                                        */
/* ═══════════════════════════════════════════════════════════════════ */

export interface BlockEditorProps {
  blocks: Block[];
  onChange: (blocks: Block[]) => void;
  /** Titles of other notes, for rendering `page` link blocks. */
  noteTitles: Record<string, { title: string; icon?: string }>;
  /** Create a nested sub-page; resolves with the new note's id + title. */
  onCreateSubpage: () => Promise<{ id: string; title: string }>;
  onOpenNote: (id: string) => void;
}

interface SlashState {
  blockId: string;
  /** Caret offset of the "/" character inside the block content. */
  anchor: number;
  query: string;
  index: number;
}

export function BlockEditor({ blocks, onChange, noteTitles, onCreateSubpage, onOpenNote }: BlockEditorProps) {
  const refs = React.useRef<Record<string, HTMLDivElement | null>>({});
  const pendingFocus = React.useRef<{ id: string; offset: number | "end" } | null>(null);
  const [slash, setSlash] = React.useState<SlashState | null>(null);
  const [dragId, setDragId] = React.useState<string | null>(null);
  const [dropId, setDropId] = React.useState<string | null>(null);

  /* Focus a block after the state update that created/changed it. */
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
    const stripped = block.content.slice(0, slash!.anchor);
    setSlash(null);

    if (item.type === "page") {
      const page = await onCreateSubpage();
      onChange(
        blocks.map((b) =>
          b.id === block.id
            ? { ...b, type: "page" as BlockType, content: page.title, linkedNoteId: page.id }
            : b
        )
      );
      return;
    }

    pendingFocus.current = { id: block.id, offset: "end" };
    onChange(
      blocks.map((b) =>
        b.id === block.id
          ? { ...b, type: item.type, content: item.type === "divider" || item.type === "toc" ? "" : stripped }
          : b
      )
    );
  };

  /* ── key handling per block ──────────────────────────── */

  const handleKeyDown = (block: Block, e: React.KeyboardEvent<HTMLDivElement>) => {
    const el = refs.current[block.id];
    if (!el) return;

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
      return; // let the "/" character be typed
    }

    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      const offset = getCaretOffset(el);
      const before = block.content.slice(0, offset);
      const after = block.content.slice(offset);

      // Empty list item → exit the list instead of continuing it
      if (LIST_TYPES.includes(block.type) && !block.content.trim()) {
        pendingFocus.current = { id: block.id, offset: 0 };
        patchBlock(block.id, { type: "text" });
        return;
      }

      const continuation: BlockType = LIST_TYPES.includes(block.type) ? block.type : "text";
      const childIndent = block.type === "toggle" && !block.collapsed ? Math.min(block.indent + 1, MAX_INDENT) : block.indent;
      const nb = newBlock(continuation, childIndent, after);
      pendingFocus.current = { id: nb.id, offset: 0 };
      const i = idx(block.id);
      const next = blocks.map((b) => (b.id === block.id ? { ...b, content: before } : b));
      next.splice(i + 1, 0, nb);
      onChange(next);
      return;
    }

    if (e.key === "Tab") {
      e.preventDefault();
      const delta = e.shiftKey ? -1 : 1;
      patchBlock(block.id, { indent: Math.max(0, Math.min(MAX_INDENT, block.indent + delta)) });
      pendingFocus.current = { id: block.id, offset: getCaretOffset(el) };
      return;
    }

    if (e.key === "Backspace" && getCaretOffset(el) === 0 && window.getSelection()?.isCollapsed) {
      // Non-text block → downgrade to text first (Notion behavior)
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
      // Merge into the block above
      const shown = visibleBlocks(blocks);
      const vi = shown.findIndex((b) => b.id === block.id);
      if (vi > 0) {
        e.preventDefault();
        const prev = shown[vi - 1];
        if (prev.type === "divider" || prev.type === "toc" || prev.type === "page") {
          onChange(blocks.filter((b) => b.id !== prev.id));
          pendingFocus.current = { id: block.id, offset: 0 };
          return;
        }
        const junction = prev.content.length;
        pendingFocus.current = { id: prev.id, offset: junction };
        onChange(
          blocks
            .map((b) => (b.id === prev.id ? { ...b, content: b.content + block.content } : b))
            .filter((b) => b.id !== block.id)
        );
      }
      return;
    }

    /* Arrow navigation across blocks at boundaries */
    if (!slash && (e.key === "ArrowUp" || e.key === "ArrowDown")) {
      const offset = getCaretOffset(el);
      const shown = visibleBlocks(blocks);
      const vi = shown.findIndex((b) => b.id === block.id);
      if (e.key === "ArrowUp" && offset === 0 && vi > 0) {
        e.preventDefault();
        const prevEl = refs.current[shown[vi - 1].id];
        if (prevEl) setCaret(prevEl, (prevEl.textContent ?? "").length);
      }
      if (e.key === "ArrowDown" && offset === (block.content ?? "").length && vi < shown.length - 1) {
        e.preventDefault();
        const nextEl = refs.current[shown[vi + 1].id];
        if (nextEl) setCaret(nextEl, 0);
      }
    }
  };

  const handleInput = (block: Block, text: string) => {
    patchBlock(block.id, { content: text });
    if (slash && slash.blockId === block.id) {
      // The query is whatever follows the "/" that opened the menu
      const after = text.slice(slash.anchor);
      if (!after.startsWith("/")) {
        setSlash(null);
      } else {
        setSlash({ ...slash, query: after.slice(1), index: 0 });
      }
    }
  };

  /* ── drag & drop ─────────────────────────────────────── */

  const handleDrop = (targetId: string) => {
    if (!dragId || dragId === targetId) {
      setDragId(null);
      setDropId(null);
      return;
    }
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
  const headings = blocks.filter((b) => ["h1", "h2", "h3"].includes(b.type) && b.content.trim());

  return (
    <div className="pb-32" onClick={(e) => {
      // Clicking empty space below the last block appends a new text block
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
                className="flex-1 cursor-default py-2 outline-none focus:ring-1 focus:ring-ring rounded"
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
                        {h.content}
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
                  {linked?.title ?? block.content ?? "Untitled"}
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
            {/* Left gutter: add + drag handle */}
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

            {/* Slash menu */}
            {isSlashHere && filteredItems.length > 0 && (
              <div className="absolute left-10 top-full z-50 mt-1 max-h-80 w-72 overflow-y-auto rounded-xl border border-border bg-card p-1 shadow-xl">
                {filteredItems.map((item, i) => {
                  const Icon = item.icon;
                  return (
                    <button
                      key={item.type}
                      className={cn(
                        "flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left",
                        i === slash!.index ? "bg-muted" : "hover:bg-muted/60"
                      )}
                      onMouseEnter={() => setSlash((s) => (s ? { ...s, index: i } : s))}
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
            )}
          </div>
        );
      })}

      {/* Click-to-append affordance */}
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
    </div>
  );
}
