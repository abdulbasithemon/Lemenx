"use client";

import * as React from "react";
import { Check, ChevronDown, ChevronRight, FileText, Lightbulb, List } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Block } from "@/types/notes";

/**
 * Read-only renderer for every block type — used by the public share page
 * and anywhere a note needs to be displayed without editing controls.
 */

const INDENT_PX = 24;

function visibleBlocks(blocks: Block[], collapsedOverrides: Record<string, boolean>) {
  const out: Block[] = [];
  let hideDeeperThan: number | null = null;
  for (const b of blocks) {
    if (hideDeeperThan !== null) {
      if (b.indent > hideDeeperThan) continue;
      hideDeeperThan = null;
    }
    out.push(b);
    const collapsed = collapsedOverrides[b.id] ?? b.collapsed;
    if (b.type === "toggle" && collapsed) hideDeeperThan = b.indent;
  }
  return out;
}

/** Consecutive-run numbering for numbered-list blocks at the same indent. */
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

export function ReadOnlyBlocks({ blocks: rawBlocks }: { blocks: Block[] }) {
  const blocks = Array.isArray(rawBlocks) ? rawBlocks : [];
  const [collapsed, setCollapsed] = React.useState<Record<string, boolean>>({});
  const shown = visibleBlocks(blocks, collapsed);
  const headings = blocks.filter((b) => ["h1", "h2", "h3"].includes(b.type) && b.content.trim());

  return (
    <div className="space-y-1">
      {shown.map((block) => {
        const style = { marginLeft: block.indent * INDENT_PX };
        const key = block.id;

        switch (block.type) {
          case "h1":
            return <h1 key={key} id={`block-${key}`} style={style} className="pt-4 text-3xl font-bold">{block.content}</h1>;
          case "h2":
            return <h2 key={key} id={`block-${key}`} style={style} className="pt-3 text-2xl font-semibold">{block.content}</h2>;
          case "h3":
            return <h3 key={key} id={`block-${key}`} style={style} className="pt-2 text-xl font-semibold">{block.content}</h3>;
          case "todo":
            return (
              <div key={key} style={style} className="flex items-start gap-2 py-0.5">
                <span className={cn(
                  "mt-0.5 flex h-4.5 w-4.5 h-[18px] w-[18px] shrink-0 items-center justify-center rounded border",
                  block.checked ? "border-primary bg-primary text-primary-foreground" : "border-muted-foreground"
                )}>
                  {block.checked && <Check className="h-3 w-3" />}
                </span>
                <span className={cn("text-[15px] leading-relaxed", block.checked && "text-muted-foreground line-through")}>
                  {block.content}
                </span>
              </div>
            );
          case "bulleted":
            return (
              <div key={key} style={style} className="flex items-start gap-2 py-0.5">
                <span className="mt-[9px] h-1.5 w-1.5 shrink-0 rounded-full bg-foreground" />
                <span className="text-[15px] leading-relaxed">{block.content}</span>
              </div>
            );
          case "numbered":
            return (
              <div key={key} style={style} className="flex items-start gap-2 py-0.5">
                <span className="w-5 shrink-0 text-right text-[15px] leading-relaxed tabular-nums">
                  {numberFor(blocks, blocks.indexOf(block))}.
                </span>
                <span className="text-[15px] leading-relaxed">{block.content}</span>
              </div>
            );
          case "toggle": {
            const isCollapsed = collapsed[key] ?? block.collapsed;
            return (
              <button
                key={key}
                style={style}
                className="flex w-full items-start gap-1 rounded py-0.5 text-left hover:bg-muted/50"
                onClick={() => setCollapsed((c) => ({ ...c, [key]: !isCollapsed }))}
              >
                {isCollapsed
                  ? <ChevronRight className="mt-1 h-4 w-4 shrink-0 text-muted-foreground" />
                  : <ChevronDown className="mt-1 h-4 w-4 shrink-0 text-muted-foreground" />}
                <span className="text-[15px] font-medium leading-relaxed">{block.content}</span>
              </button>
            );
          }
          case "quote":
            return (
              <blockquote key={key} style={style} className="border-l-[3px] border-foreground py-0.5 pl-4 text-[15px] italic leading-relaxed">
                {block.content}
              </blockquote>
            );
          case "divider":
            return <hr key={key} style={style} className="my-3 border-border" />;
          case "callout":
            return (
              <div key={key} style={style} className="flex items-start gap-3 rounded-lg bg-muted p-4">
                <Lightbulb className="mt-0.5 h-5 w-5 shrink-0 text-amber-500" />
                <span className="text-[15px] leading-relaxed">{block.content}</span>
              </div>
            );
          case "code":
            return (
              <pre key={key} style={style} className="overflow-x-auto rounded-lg bg-zinc-950 px-4 py-3 font-mono text-[13px] leading-relaxed text-zinc-100 dark:bg-zinc-900">
                {block.content}
              </pre>
            );
          case "toc":
            return (
              <div key={key} style={style} className="rounded-lg border border-border p-4">
                <p className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  <List className="h-3.5 w-3.5" /> Table of contents
                </p>
                {headings.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No headings yet.</p>
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
                        onClick={() => document.getElementById(`block-${h.id}`)?.scrollIntoView({ behavior: "smooth" })}
                      >
                        {h.content}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            );
          case "page":
            return (
              <div key={key} style={style} className="flex items-center gap-2 py-0.5 text-[15px] text-muted-foreground">
                <FileText className="h-4 w-4 shrink-0" />
                <span className="underline decoration-muted-foreground/40">{block.content || "Untitled page"}</span>
              </div>
            );
          default:
            return (
              <p key={key} style={style} className="min-h-[1.5em] py-0.5 text-[15px] leading-relaxed whitespace-pre-wrap">
                {block.content}
              </p>
            );
        }
      })}
    </div>
  );
}
