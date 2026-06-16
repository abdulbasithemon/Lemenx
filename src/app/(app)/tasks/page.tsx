"use client";

import * as React from "react";
import {
  Plus, X, ChevronDown, ChevronRight, Search, Pencil, Trash2,
  RotateCcw, Flag, Clock, AlignLeft, Pin, PinOff, Repeat2,
  SlidersHorizontal, CheckSquare, StickyNote, Palette,
  MoreVertical, Copy, MoveRight, Check, Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type {
  Category, Task, Note, Priority, TaskStatus, RecurringType, NoteColor,
} from "@/types/tasks";

/* ═══════════════════════════════════════════════════════════════════ */
/*  CONSTANTS & HELPERS                                                */
/* ═══════════════════════════════════════════════════════════════════ */

const DEFAULT_CATEGORIES: Category[] = [
  { id: "work",     name: "Work",     color: "#6366f1" },
  { id: "personal", name: "Personal", color: "#10b981" },
  { id: "health",   name: "Health",   color: "#ef4444" },
  { id: "learning", name: "Learning", color: "#f59e0b" },
  { id: "shopping", name: "Shopping", color: "#8b5cf6" },
  { id: "finance",  name: "Finance",  color: "#0ea5e9" },
];

const PALETTE = [
  "#6366f1","#10b981","#ef4444","#f59e0b",
  "#8b5cf6","#0ea5e9","#ec4899","#14b8a6",
];

const NOTE_COLORS: Record<NoteColor, string> = {
  white:  "bg-white dark:bg-zinc-900",
  yellow: "bg-amber-50 dark:bg-amber-900/30",
  green:  "bg-emerald-50 dark:bg-emerald-900/30",
  blue:   "bg-sky-50 dark:bg-sky-900/30",
  pink:   "bg-pink-50 dark:bg-pink-900/30",
  purple: "bg-violet-50 dark:bg-violet-900/30",
};

const NOTE_COLOR_DOT: Record<NoteColor, string> = {
  white:  "bg-zinc-200",
  yellow: "bg-amber-300",
  green:  "bg-emerald-300",
  blue:   "bg-sky-300",
  pink:   "bg-pink-300",
  purple: "bg-violet-300",
};

const PRIORITY_META: Record<Priority, { label: string; color: string }> = {
  high:   { label: "High",   color: "#ef4444" },
  medium: { label: "Medium", color: "#f59e0b" },
  low:    { label: "Low",    color: "#9ca3af" },
};

function uid() {
  return Math.random().toString(36).slice(2, 10);
}

function todayLabel() {
  return new Date().toLocaleDateString("en-US", {
    weekday: "long", day: "numeric", month: "long",
  });
}

function motivationalText(pct: number) {
  if (pct === 0)   return "Let's get started — you've got this! 💪";
  if (pct < 30)    return "Great start! Keep the momentum going.";
  if (pct < 60)    return "You're making progress. Keep it up!";
  if (pct < 90)    return "Almost there — you're halfway there! 🔥";
  if (pct < 100)   return "So close! Just a few more to go.";
  return "All done — amazing work today! 🎉";
}

/* ═══════════════════════════════════════════════════════════════════ */
/*  CATEGORY MANAGER PANEL                                             */
/* ═══════════════════════════════════════════════════════════════════ */

function CategoryManager({
  categories,
  tasks,
  onAdd,
  onRename,
  onDelete,
  onClose,
}: {
  categories: Category[];
  tasks: Task[];
  onAdd: (c: Category) => void;
  onRename: (id: string, name: string) => void;
  onDelete: (id: string) => void;
  onClose: () => void;
}) {
  const [newName, setNewName] = React.useState("");
  const [newColor, setNewColor] = React.useState(PALETTE[0]);
  const [editingId, setEditingId] = React.useState<string | null>(null);
  const [editName, setEditName] = React.useState("");

  const usageCount = (id: string) => tasks.filter((t) => t.categoryId === id).length;

  const handleAdd = () => {
    if (!newName.trim()) return;
    onAdd({ id: uid(), name: newName.trim(), color: newColor });
    setNewName("");
    setNewColor(PALETTE[0]);
  };

  const handleDelete = (c: Category) => {
    const count = usageCount(c.id);
    if (count > 0 && !confirm(`"${c.name}" is used by ${count} task(s). Delete anyway?`)) return;
    onDelete(c.id);
  };

  return (
    <div className="mb-6 rounded-xl border border-border bg-card shadow-sm">
      <div className="flex items-center justify-between border-b border-border px-5 py-4">
        <h3 className="font-semibold">Manage Categories</h3>
        <Button variant="ghost" size="icon" onClick={onClose}><X className="h-4 w-4" /></Button>
      </div>
      <div className="divide-y divide-border">
        {categories.map((c) => (
          <div key={c.id} className="flex items-center gap-3 px-5 py-3">
            <span className="h-3 w-3 shrink-0 rounded-full" style={{ background: c.color }} />
            {editingId === c.id ? (
              <input
                autoFocus
                className="flex-1 rounded border border-input bg-background px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") { onRename(c.id, editName); setEditingId(null); }
                  if (e.key === "Escape") setEditingId(null);
                }}
              />
            ) : (
              <span className="flex-1 text-sm">{c.name}</span>
            )}
            <span className="text-xs text-muted-foreground">{usageCount(c.id)} tasks</span>
            <button
              className="rounded p-1 hover:bg-muted"
              onClick={() => { setEditingId(c.id); setEditName(c.name); }}
            >
              <Pencil className="h-3.5 w-3.5 text-muted-foreground" />
            </button>
            <button
              className="rounded p-1 hover:bg-destructive/10"
              onClick={() => handleDelete(c)}
            >
              <Trash2 className="h-3.5 w-3.5 text-destructive" />
            </button>
          </div>
        ))}
      </div>
      {/* Add new */}
      <div className="flex items-center gap-2 px-5 py-4">
        <div className="flex gap-1">
          {PALETTE.map((col) => (
            <button
              key={col}
              className={cn("h-5 w-5 rounded-full transition-transform", newColor === col && "ring-2 ring-offset-1 ring-primary scale-110")}
              style={{ background: col }}
              onClick={() => setNewColor(col)}
            />
          ))}
        </div>
        <Input
          className="flex-1"
          placeholder="New category name…"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleAdd()}
        />
        <Button size="sm" onClick={handleAdd} disabled={!newName.trim()}>
          <Plus className="h-4 w-4" /> Add
        </Button>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════ */
/*  DAY OVERVIEW STRIP                                                 */
/* ═══════════════════════════════════════════════════════════════════ */

function DayOverview({ tasks }: { tasks: Task[] }) {
  const total = tasks.length;
  const done  = tasks.filter((t) => t.status === "done").length;
  const remaining = total - done;
  const pct = total === 0 ? 0 : Math.round((done / total) * 100);

  return (
    <div className="mb-6 rounded-xl border border-border bg-card p-5 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            {todayLabel()}
          </p>
          <p className="mt-1 text-sm text-muted-foreground">{motivationalText(pct)}</p>
        </div>
        <div className="flex gap-5 text-center">
          {[["Total", total], ["Done", done], ["Left", remaining]].map(([label, val]) => (
            <div key={label as string}>
              <p className="text-2xl font-bold">{val}</p>
              <p className="text-xs text-muted-foreground">{label}</p>
            </div>
          ))}
        </div>
      </div>
      <div className="mt-4">
        <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
          <div
            className="h-full rounded-full bg-primary transition-all duration-500"
            style={{ width: `${pct}%` }}
          />
        </div>
        <p className="mt-1 text-right text-xs text-muted-foreground">{pct}% complete</p>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════ */
/*  QUICK ADD BAR                                                      */
/* ═══════════════════════════════════════════════════════════════════ */

function QuickAdd({
  categories,
  onAdd,
}: {
  categories: Category[];
  onAdd: (t: Partial<Task>) => void;
}) {
  const [title, setTitle] = React.useState("");
  const [catId, setCatId] = React.useState(categories[0]?.id ?? "");
  const [priority, setPriority] = React.useState<Priority>("medium");
  const [dueTime, setDueTime] = React.useState("");
  const [recurring, setRecurring] = React.useState<RecurringType>("none");
  const [expanded, setExpanded] = React.useState(false);

  const submit = () => {
    if (!title.trim()) return;
    onAdd({ title: title.trim(), categoryId: catId, priority, dueTime: dueTime || undefined, recurring });
    setTitle("");
    setDueTime("");
    setExpanded(false);
  };

  return (
    <div className="mb-4 rounded-xl border border-border bg-card shadow-sm">
      <div className="flex items-center gap-2 px-4 py-3">
        <Plus className="h-5 w-5 shrink-0 text-muted-foreground" />
        <input
          className="flex-1 bg-transparent text-sm placeholder:text-muted-foreground focus:outline-none"
          placeholder="Add a task — press Enter to save…"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onFocus={() => setExpanded(true)}
          onKeyDown={(e) => e.key === "Enter" && submit()}
        />
        <button
          className="text-xs text-muted-foreground hover:text-foreground"
          onClick={() => setExpanded((v) => !v)}
        >
          {expanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
        </button>
      </div>

      {expanded && (
        <div className="border-t border-border px-4 py-3">
          <div className="flex flex-wrap items-center gap-3">
            {/* Category */}
            <select
              className="rounded-lg border border-input bg-background px-2 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-ring"
              value={catId}
              onChange={(e) => setCatId(e.target.value)}
            >
              {categories.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>

            {/* Priority */}
            <select
              className="rounded-lg border border-input bg-background px-2 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-ring"
              value={priority}
              onChange={(e) => setPriority(e.target.value as Priority)}
            >
              <option value="high">🔴 High</option>
              <option value="medium">🟡 Medium</option>
              <option value="low">⚪ Low</option>
            </select>

            {/* Due time */}
            <input
              type="time"
              className="rounded-lg border border-input bg-background px-2 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-ring"
              value={dueTime}
              onChange={(e) => setDueTime(e.target.value)}
            />

            {/* Recurring */}
            <select
              className="rounded-lg border border-input bg-background px-2 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-ring"
              value={recurring}
              onChange={(e) => setRecurring(e.target.value as RecurringType)}
            >
              <option value="none">No repeat</option>
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
              <option value="custom">Custom</option>
            </select>

            <Button size="sm" onClick={submit} disabled={!title.trim()}>
              Add task
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════ */
/*  TASK ITEM                                                          */
/* ═══════════════════════════════════════════════════════════════════ */

function TaskItem({
  task,
  categories,
  onToggle,
  onUpdate,
  onDelete,
  onDuplicate,
  onMove,
}: {
  task: Task;
  categories: Category[];
  onToggle: () => void;
  onUpdate: (patch: Partial<Task>) => void;
  onDelete: () => void;
  onDuplicate: () => void;
  onMove: (status: TaskStatus) => void;
}) {
  const [editing, setEditing] = React.useState(false);
  const [editTitle, setEditTitle] = React.useState(task.title);
  const [noteOpen, setNoteOpen] = React.useState(false);
  const [noteText, setNoteText] = React.useState(task.note ?? "");
  const [menuOpen, setMenuOpen] = React.useState(false);
  const menuRef = React.useRef<HTMLDivElement>(null);

  const cat = categories.find((c) => c.id === task.categoryId);
  const pri = PRIORITY_META[task.priority];

  React.useEffect(() => {
    const close = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false);
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, []);

  const isDone = task.status === "done";

  return (
    <div className={cn(
      "group relative flex flex-col rounded-lg border border-border bg-background px-4 py-3 transition-opacity",
      isDone && "opacity-60"
    )}>
      <div className="flex items-start gap-3">
        {/* Checkbox */}
        <button
          onClick={onToggle}
          className={cn(
            "mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded border-2 transition-colors",
            isDone
              ? "border-primary bg-primary text-primary-foreground"
              : "border-muted-foreground hover:border-primary"
          )}
        >
          {isDone && <Check className="h-3 w-3" />}
        </button>

        {/* Title */}
        <div className="flex-1 min-w-0">
          {editing ? (
            <input
              autoFocus
              className="w-full bg-transparent text-sm font-medium focus:outline-none"
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") { onUpdate({ title: editTitle }); setEditing(false); }
                if (e.key === "Escape") { setEditTitle(task.title); setEditing(false); }
              }}
              onBlur={() => { onUpdate({ title: editTitle }); setEditing(false); }}
            />
          ) : (
            <p
              className={cn("text-sm font-medium leading-snug cursor-text", isDone && "line-through")}
              onDoubleClick={() => setEditing(true)}
            >
              {task.title}
            </p>
          )}

          {/* Meta row */}
          <div className="mt-1.5 flex flex-wrap items-center gap-2">
            {cat && (
              <span className="flex items-center gap-1 text-xs text-muted-foreground">
                <span className="h-2 w-2 rounded-full" style={{ background: cat.color }} />
                {cat.name}
              </span>
            )}
            <span className="flex items-center gap-1 text-xs text-muted-foreground">
              <span className="h-2 w-2 rounded-full" style={{ background: pri.color }} />
              {pri.label}
            </span>
            {task.dueTime && (
              <span className="flex items-center gap-1 text-xs text-muted-foreground">
                <Clock className="h-3 w-3" />
                {task.dueTime}
              </span>
            )}
            {task.recurring !== "none" && (
              <span className="flex items-center gap-1 text-xs text-muted-foreground">
                <Repeat2 className="h-3 w-3" />
                {task.recurring}
              </span>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          {task.note !== undefined || noteOpen ? (
            <button
              className="rounded p-1 hover:bg-muted"
              onClick={() => setNoteOpen((v) => !v)}
              title="Toggle note"
            >
              <AlignLeft className="h-3.5 w-3.5 text-muted-foreground" />
            </button>
          ) : (
            <button
              className="rounded p-1 hover:bg-muted"
              onClick={() => setNoteOpen(true)}
              title="Add note"
            >
              <AlignLeft className="h-3.5 w-3.5 text-muted-foreground" />
            </button>
          )}

          <div className="relative" ref={menuRef}>
            <button
              className="rounded p-1 hover:bg-muted"
              onClick={() => setMenuOpen((v) => !v)}
            >
              <MoreVertical className="h-3.5 w-3.5 text-muted-foreground" />
            </button>
            {menuOpen && (
              <div className="absolute right-0 top-7 z-50 w-44 rounded-xl border border-border bg-card shadow-lg">
                {(["todo", "inprogress", "done"] as TaskStatus[]).filter((s) => s !== task.status).map((s) => (
                  <button
                    key={s}
                    className="flex w-full items-center gap-2 px-3 py-2 text-xs hover:bg-muted"
                    onClick={() => { onMove(s); setMenuOpen(false); }}
                  >
                    <MoveRight className="h-3.5 w-3.5" />
                    Move to {s === "todo" ? "To Do" : s === "inprogress" ? "In Progress" : "Done"}
                  </button>
                ))}
                <div className="my-1 border-t border-border" />
                <button
                  className="flex w-full items-center gap-2 px-3 py-2 text-xs hover:bg-muted"
                  onClick={() => { onDuplicate(); setMenuOpen(false); }}
                >
                  <Copy className="h-3.5 w-3.5" /> Duplicate
                </button>
                <button
                  className="flex w-full items-center gap-2 px-3 py-2 text-xs text-destructive hover:bg-destructive/10"
                  onClick={() => { onDelete(); setMenuOpen(false); }}
                >
                  <Trash2 className="h-3.5 w-3.5" /> Delete
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Expandable note */}
      {noteOpen && (
        <div className="mt-3 pl-8">
          <textarea
            className="w-full resize-none rounded-lg border border-input bg-muted/30 p-2 text-xs text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
            rows={2}
            placeholder="Add a note to this task…"
            value={noteText}
            onChange={(e) => setNoteText(e.target.value)}
            onBlur={() => onUpdate({ note: noteText })}
          />
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════ */
/*  SWIMLANE                                                           */
/* ═══════════════════════════════════════════════════════════════════ */

const LANE_META: Record<TaskStatus, { label: string; empty: string; accent: string }> = {
  todo:       { label: "To Do",       empty: "Nothing to do yet — add a task above!",       accent: "bg-sky-500" },
  inprogress: { label: "In Progress", empty: "Nothing in progress yet — start a task!",     accent: "bg-amber-500" },
  done:       { label: "Done",        empty: "No completed tasks yet — keep going!",         accent: "bg-emerald-500" },
};

function Swimlane({
  status,
  tasks,
  categories,
  onToggle,
  onUpdate,
  onDelete,
  onDuplicate,
  onMove,
  onClearDone,
}: {
  status: TaskStatus;
  tasks: Task[];
  categories: Category[];
  onToggle: (id: string) => void;
  onUpdate: (id: string, patch: Partial<Task>) => void;
  onDelete: (id: string) => void;
  onDuplicate: (id: string) => void;
  onMove: (id: string, status: TaskStatus) => void;
  onClearDone?: () => void;
}) {
  const [collapsed, setCollapsed] = React.useState(status === "done");
  const meta = LANE_META[status];

  return (
    <div className="mb-6">
      {/* Sticky header */}
      <div className="sticky top-0 z-10 flex items-center gap-3 rounded-lg bg-muted/80 px-3 py-2 backdrop-blur mb-3">
        <span className={cn("h-2.5 w-2.5 rounded-full", meta.accent)} />
        <span className="flex-1 text-sm font-semibold">{meta.label}</span>
        <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
          {tasks.length}
        </span>
        {status === "done" && tasks.length > 0 && onClearDone && (
          <button
            className="flex items-center gap-1 text-xs text-muted-foreground hover:text-destructive"
            onClick={onClearDone}
          >
            <RotateCcw className="h-3 w-3" /> Clear done
          </button>
        )}
        <button
          className="rounded p-1 hover:bg-muted"
          onClick={() => setCollapsed((v) => !v)}
        >
          {collapsed
            ? <ChevronRight className="h-4 w-4 text-muted-foreground" />
            : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
        </button>
      </div>

      {!collapsed && (
        <div className="space-y-2">
          {tasks.length === 0 ? (
            <div className="rounded-lg border border-dashed border-border py-8 text-center text-sm text-muted-foreground">
              {meta.empty}
            </div>
          ) : (
            tasks.map((task) => (
              <TaskItem
                key={task.id}
                task={task}
                categories={categories}
                onToggle={() => onToggle(task.id)}
                onUpdate={(patch) => onUpdate(task.id, patch)}
                onDelete={() => onDelete(task.id)}
                onDuplicate={() => onDuplicate(task.id)}
                onMove={(s) => onMove(task.id, s)}
              />
            ))
          )}
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════ */
/*  NOTE CARD                                                          */
/* ═══════════════════════════════════════════════════════════════════ */

function NoteCard({
  note,
  categories,
  onUpdate,
  onDelete,
  onExpand,
}: {
  note: Note;
  categories: Category[];
  onUpdate: (patch: Partial<Note>) => void;
  onDelete: () => void;
  onExpand: () => void;
}) {
  const cat = categories.find((c) => c.id === note.categoryId);

  return (
    <div
      className={cn(
        "group relative flex flex-col rounded-xl border border-border p-4 shadow-sm cursor-pointer hover:shadow-md transition-shadow",
        NOTE_COLORS[note.color]
      )}
      onClick={onExpand}
    >
      {/* Pin + delete */}
      <div className="absolute right-3 top-3 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          className="rounded p-1 hover:bg-black/10"
          onClick={(e) => { e.stopPropagation(); onUpdate({ pinned: !note.pinned }); }}
          title={note.pinned ? "Unpin" : "Pin"}
        >
          {note.pinned
            ? <PinOff className="h-3.5 w-3.5 text-primary" />
            : <Pin className="h-3.5 w-3.5 text-muted-foreground" />}
        </button>
        <button
          className="rounded p-1 hover:bg-destructive/10"
          onClick={(e) => { e.stopPropagation(); onDelete(); }}
          title="Delete"
        >
          <Trash2 className="h-3.5 w-3.5 text-destructive" />
        </button>
      </div>

      {note.pinned && (
        <Pin className="mb-2 h-3.5 w-3.5 text-primary" />
      )}

      <h4 className="mb-1 font-semibold leading-snug line-clamp-1">
        {note.title || note.body.slice(0, 40) || "Untitled"}
      </h4>
      <p className="flex-1 text-sm text-muted-foreground line-clamp-3 whitespace-pre-line">
        {note.body || "No content yet…"}
      </p>

      <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          {cat && (
            <span className="flex items-center gap-1 rounded-full bg-black/5 px-2 py-0.5 text-[10px] font-medium">
              <span className="h-1.5 w-1.5 rounded-full" style={{ background: cat.color }} />
              {cat.name}
            </span>
          )}
        </div>
        <span className="text-[10px] text-muted-foreground">
          {new Date(note.updatedAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
        </span>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════ */
/*  NOTE EDITOR (inline)                                               */
/* ═══════════════════════════════════════════════════════════════════ */

function NoteEditor({
  note,
  categories,
  onSave,
  onClose,
}: {
  note: Partial<Note>;
  categories: Category[];
  onSave: (n: Partial<Note>) => void;
  onClose: () => void;
}) {
  const [title, setTitle] = React.useState(note.title ?? "");
  const [body, setBody] = React.useState(note.body ?? "");
  const [catId, setCatId] = React.useState(note.categoryId ?? categories[0]?.id ?? "");
  const [color, setColor] = React.useState<NoteColor>(note.color ?? "white");
  const [pinned, setPinned] = React.useState(note.pinned ?? false);

  const save = () => onSave({ title, body, categoryId: catId, color, pinned });

  return (
    <div className={cn("rounded-xl border border-border p-5 shadow-md mb-6", NOTE_COLORS[color])}>
      <div className="mb-3 flex items-center justify-between gap-3">
        <input
          autoFocus
          className="flex-1 bg-transparent text-lg font-semibold focus:outline-none placeholder:text-muted-foreground"
          placeholder="Note title (optional)…"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
        <div className="flex items-center gap-2">
          <button
            className="rounded p-1 hover:bg-black/10"
            onClick={() => setPinned((v) => !v)}
            title="Pin note"
          >
            {pinned
              ? <Pin className="h-4 w-4 text-primary" />
              : <PinOff className="h-4 w-4 text-muted-foreground" />}
          </button>
          <button className="rounded p-1 hover:bg-black/10" onClick={onClose}>
            <X className="h-4 w-4 text-muted-foreground" />
          </button>
        </div>
      </div>

      <textarea
        className="w-full resize-none bg-transparent text-sm text-foreground placeholder:text-muted-foreground focus:outline-none"
        rows={8}
        placeholder="Start writing…"
        value={body}
        onChange={(e) => setBody(e.target.value)}
      />

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-border/40 pt-4">
        <div className="flex items-center gap-3">
          {/* Category */}
          <select
            className="rounded-lg border border-input bg-background/60 px-2 py-1.5 text-xs focus:outline-none"
            value={catId}
            onChange={(e) => setCatId(e.target.value)}
          >
            {categories.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>

          {/* Color picker */}
          <div className="flex items-center gap-1">
            <Palette className="h-3.5 w-3.5 text-muted-foreground" />
            {(Object.keys(NOTE_COLORS) as NoteColor[]).map((c) => (
              <button
                key={c}
                className={cn(
                  "h-5 w-5 rounded-full border",
                  NOTE_COLOR_DOT[c],
                  color === c && "ring-2 ring-primary ring-offset-1"
                )}
                onClick={() => setColor(c)}
              />
            ))}
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={onClose}>Cancel</Button>
          <Button size="sm" onClick={save}>Save note</Button>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════ */
/*  FILTER BAR                                                         */
/* ═══════════════════════════════════════════════════════════════════ */

type FilterType = "all" | "priority" | "completed" | "pinned" | string;

function FilterBar({
  categories,
  activeFilter,
  activeCategory,
  search,
  onFilter,
  onCategory,
  onSearch,
  showPinned,
}: {
  categories: Category[];
  activeFilter: FilterType;
  activeCategory: string;
  search: string;
  onFilter: (f: FilterType) => void;
  onCategory: (id: string) => void;
  onSearch: (s: string) => void;
  showPinned?: boolean;
}) {
  const pills: { id: FilterType; label: string }[] = [
    { id: "all", label: "All" },
    { id: "priority", label: "By Priority" },
    { id: "completed", label: "Completed" },
    ...(showPinned ? [{ id: "pinned" as FilterType, label: "Pinned" }] : []),
  ];

  return (
    <div className="mb-4 space-y-2">
      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <input
          className="h-10 w-full rounded-lg border border-input bg-card pl-9 pr-3 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          placeholder="Search tasks and notes…"
          value={search}
          onChange={(e) => onSearch(e.target.value)}
        />
      </div>

      {/* Filter pills */}
      <div className="flex flex-wrap items-center gap-2">
        {pills.map((p) => (
          <button
            key={p.id}
            onClick={() => onFilter(p.id)}
            className={cn(
              "rounded-full px-3 py-1 text-xs font-medium transition-colors",
              activeFilter === p.id
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground hover:bg-muted/80"
            )}
          >
            {p.label}
          </button>
        ))}

        {/* Category sub-filters */}
        {activeFilter === "priority" && (
          <div className="flex flex-wrap gap-2">
            {categories.map((c) => (
              <button
                key={c.id}
                onClick={() => onCategory(activeCategory === c.id ? "" : c.id)}
                className={cn(
                  "flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium transition-colors border",
                  activeCategory === c.id
                    ? "border-transparent text-white"
                    : "border-border text-muted-foreground hover:border-primary/50"
                )}
                style={activeCategory === c.id ? { background: c.color } : {}}
              >
                <span className="h-1.5 w-1.5 rounded-full" style={{ background: c.color }} />
                {c.name}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════ */
/*  CONFETTI (pure CSS, no library)                                    */
/* ═══════════════════════════════════════════════════════════════════ */

function Confetti() {
  const colors = ["#6366f1","#10b981","#f59e0b","#ec4899","#0ea5e9"];
  return (
    <div className="pointer-events-none fixed inset-0 z-50 flex items-center justify-center">
      <div className="relative">
        {Array.from({ length: 30 }).map((_, i) => (
          <span
            key={i}
            className="absolute block h-3 w-3 rounded-sm animate-bounce"
            style={{
              background: colors[i % colors.length],
              left: `${Math.random() * 400 - 200}px`,
              top: `${Math.random() * 400 - 200}px`,
              animationDuration: `${0.5 + Math.random()}s`,
              animationDelay: `${Math.random() * 0.3}s`,
              transform: `rotate(${Math.random() * 360}deg) scale(${0.5 + Math.random()})`,
            }}
          />
        ))}
        <div className="flex flex-col items-center gap-2 rounded-2xl bg-card px-8 py-6 shadow-2xl border border-border">
          <Sparkles className="h-10 w-10 text-primary" />
          <p className="text-xl font-bold">All done!</p>
          <p className="text-sm text-muted-foreground">Amazing work today 🎉</p>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════ */
/*  MAIN PAGE                                                          */
/* ═══════════════════════════════════════════════════════════════════ */

export default function TasksPage() {
  /* ── state ─────────────────────────────────────────── */
  const [categories, setCategories] = React.useState<Category[]>(DEFAULT_CATEGORIES);
  const [tasks, setTasks] = React.useState<Task[]>([
    {
      id: uid(), title: "Review monthly budget", status: "todo", priority: "high",
      categoryId: "finance", dueTime: "10:00", recurring: "none",
      createdAt: new Date().toISOString(), order: 0,
    },
    {
      id: uid(), title: "Morning workout", status: "inprogress", priority: "medium",
      categoryId: "health", recurring: "daily",
      createdAt: new Date().toISOString(), order: 1,
    },
    {
      id: uid(), title: "Buy groceries", status: "done", priority: "low",
      categoryId: "shopping", recurring: "none",
      createdAt: new Date().toISOString(), completedAt: new Date().toISOString(), order: 2,
    },
  ]);
  const [notes, setNotes] = React.useState<Note[]>([
    {
      id: uid(), title: "Q3 Goals", body: "• Increase savings by 20%\n• Complete React course\n• Start meal prepping",
      categoryId: "work", color: "blue", pinned: true,
      createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
    },
    {
      id: uid(), title: "Shopping list", body: "Milk, eggs, bread, chicken, vegetables",
      categoryId: "shopping", color: "yellow", pinned: false,
      createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
    },
  ]);

  const [activeTab, setActiveTab] = React.useState<"tasks" | "notes">("tasks");
  const [showCatManager, setShowCatManager] = React.useState(false);
  const [filter, setFilter] = React.useState<FilterType>("all");
  const [filterCat, setFilterCat] = React.useState("");
  const [search, setSearch] = React.useState("");
  const [editingNote, setEditingNote] = React.useState<Partial<Note> | null>(null);
  const [confetti, setConfetti] = React.useState(false);
  const prevDone = React.useRef(false);

  /* ── confetti trigger ──────────────────────────────── */
  React.useEffect(() => {
    const total = tasks.length;
    const done  = tasks.filter((t) => t.status === "done").length;
    const allDone = total > 0 && done === total;
    if (allDone && !prevDone.current) {
      setConfetti(true);
      setTimeout(() => setConfetti(false), 3000);
    }
    prevDone.current = allDone;
  }, [tasks]);

  /* ── category ops ──────────────────────────────────── */
  const addCategory    = (c: Category) => setCategories((cs) => [...cs, c]);
  const renameCategory = (id: string, name: string) =>
    setCategories((cs) => cs.map((c) => c.id === id ? { ...c, name } : c));
  const deleteCategory = (id: string) => {
    setCategories((cs) => cs.filter((c) => c.id !== id));
    setTasks((ts) => ts.map((t) => t.categoryId === id ? { ...t, categoryId: categories[0]?.id ?? "" } : t));
    setNotes((ns) => ns.map((n) => n.categoryId === id ? { ...n, categoryId: categories[0]?.id ?? "" } : n));
  };

  /* ── task ops ──────────────────────────────────────── */
  const addTask = (partial: Partial<Task>) => {
    setTasks((ts) => [
      ...ts,
      {
        id: uid(), title: "", status: "todo", priority: "medium",
        categoryId: categories[0]?.id ?? "", recurring: "none",
        createdAt: new Date().toISOString(), order: ts.length,
        ...partial,
      },
    ]);
  };

  const toggleTask = (id: string) => {
    setTasks((ts) =>
      ts.map((t) =>
        t.id !== id ? t : {
          ...t,
          status: t.status === "done" ? "todo" : "done",
          completedAt: t.status === "done" ? undefined : new Date().toISOString(),
        }
      )
    );
  };

  const updateTask = (id: string, patch: Partial<Task>) =>
    setTasks((ts) => ts.map((t) => t.id === id ? { ...t, ...patch } : t));

  const deleteTask = (id: string) => setTasks((ts) => ts.filter((t) => t.id !== id));

  const duplicateTask = (id: string) => {
    const src = tasks.find((t) => t.id === id);
    if (!src) return;
    setTasks((ts) => [...ts, { ...src, id: uid(), title: src.title + " (copy)", status: "todo" }]);
  };

  const moveTask = (id: string, status: TaskStatus) =>
    setTasks((ts) => ts.map((t) => t.id === id ? { ...t, status } : t));

  const clearDone = () => setTasks((ts) => ts.filter((t) => t.status !== "done"));

  /* ── note ops ──────────────────────────────────────── */
  const saveNote = (partial: Partial<Note>) => {
    const now = new Date().toISOString();
    if (partial.id) {
      setNotes((ns) => ns.map((n) => n.id === partial.id ? { ...n, ...partial, updatedAt: now } : n));
    } else {
      setNotes((ns) => [
        ...ns,
        {
          id: uid(), title: "", body: "", categoryId: categories[0]?.id ?? "",
          color: "white", pinned: false, createdAt: now, updatedAt: now,
          ...partial,
        },
      ]);
    }
    setEditingNote(null);
  };

  const deleteNote = (id: string) => setNotes((ns) => ns.filter((n) => n.id !== id));
  const updateNote = (id: string, patch: Partial<Note>) => {
    const now = new Date().toISOString();
    setNotes((ns) => ns.map((n) => n.id === id ? { ...n, ...patch, updatedAt: now } : n));
  };

  /* ── filtered views ────────────────────────────────── */
  const filterTasks = (ts: Task[]) => {
    let out = ts;
    if (search) out = out.filter((t) => t.title.toLowerCase().includes(search.toLowerCase()));
    if (filter === "completed") out = out.filter((t) => t.status === "done");
    if (filter === "priority" && filterCat) out = out.filter((t) => t.categoryId === filterCat);
    return out;
  };

  const filterNotes = (ns: Note[]) => {
    let out = ns;
    if (search) out = out.filter((n) =>
      n.title.toLowerCase().includes(search.toLowerCase()) ||
      n.body.toLowerCase().includes(search.toLowerCase())
    );
    if (filter === "pinned") out = out.filter((n) => n.pinned);
    if (filter === "priority" && filterCat) out = out.filter((n) => n.categoryId === filterCat);
    // pinned always first
    return [...out.filter((n) => n.pinned), ...out.filter((n) => !n.pinned)];
  };

  const filteredTasks = filterTasks(tasks);
  const byStatus = (s: TaskStatus) => filteredTasks.filter((t) => t.status === s);

  const filteredNotes = filterNotes(notes);

  /* ── render ────────────────────────────────────────── */
  return (
    <div className="pb-16">
      {confetti && <Confetti />}

      {/* Page heading + top controls */}
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <CheckSquare className="h-5 w-5" />
          </span>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Tasks & Notes</h1>
            <p className="text-sm text-muted-foreground">Your daily tracker and notebook — all in one place.</p>
          </div>
        </div>
        <Button variant="outline" size="sm" onClick={() => setShowCatManager((v) => !v)}>
          <SlidersHorizontal className="h-4 w-4" />
          Manage Categories
        </Button>
      </div>

      {/* Category Manager */}
      {showCatManager && (
        <CategoryManager
          categories={categories}
          tasks={tasks}
          onAdd={addCategory}
          onRename={renameCategory}
          onDelete={deleteCategory}
          onClose={() => setShowCatManager(false)}
        />
      )}

      {/* Day overview */}
      <DayOverview tasks={tasks} />

      {/* Tabs */}
      <div className="mb-5 flex items-center gap-1 rounded-xl border border-border bg-card p-1 w-fit">
        <button
          onClick={() => setActiveTab("tasks")}
          className={cn(
            "flex items-center gap-2 rounded-lg px-5 py-2 text-sm font-medium transition-colors",
            activeTab === "tasks"
              ? "bg-primary text-primary-foreground shadow"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          <CheckSquare className="h-4 w-4" /> Tasks
        </button>
        <button
          onClick={() => setActiveTab("notes")}
          className={cn(
            "flex items-center gap-2 rounded-lg px-5 py-2 text-sm font-medium transition-colors",
            activeTab === "notes"
              ? "bg-primary text-primary-foreground shadow"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          <StickyNote className="h-4 w-4" /> Notes
        </button>
      </div>

      {/* Filter bar */}
      <FilterBar
        categories={categories}
        activeFilter={filter}
        activeCategory={filterCat}
        search={search}
        onFilter={setFilter}
        onCategory={setFilterCat}
        onSearch={setSearch}
        showPinned={activeTab === "notes"}
      />

      {/* ── TASKS TAB ── */}
      {activeTab === "tasks" && (
        <>
          <QuickAdd categories={categories} onAdd={addTask} />
          {(["todo", "inprogress", "done"] as TaskStatus[]).map((s) => (
            <Swimlane
              key={s}
              status={s}
              tasks={byStatus(s)}
              categories={categories}
              onToggle={toggleTask}
              onUpdate={updateTask}
              onDelete={deleteTask}
              onDuplicate={duplicateTask}
              onMove={moveTask}
              onClearDone={s === "done" ? clearDone : undefined}
            />
          ))}
        </>
      )}

      {/* ── NOTES TAB ── */}
      {activeTab === "notes" && (
        <>
          {/* New note button / inline editor */}
          {editingNote ? (
            <NoteEditor
              note={editingNote}
              categories={categories}
              onSave={saveNote}
              onClose={() => setEditingNote(null)}
            />
          ) : (
            <Button
              className="mb-6 w-full border-dashed"
              variant="outline"
              onClick={() => setEditingNote({})}
            >
              <Plus className="h-4 w-4" /> New Note
            </Button>
          )}

          {filteredNotes.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border py-16 text-center text-sm text-muted-foreground">
              No notes yet — click &quot;New Note&quot; to create your first one!
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {filteredNotes.map((note) => (
                <NoteCard
                  key={note.id}
                  note={note}
                  categories={categories}
                  onUpdate={(patch) => updateNote(note.id, patch)}
                  onDelete={() => deleteNote(note.id)}
                  onExpand={() => setEditingNote(note)}
                />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
