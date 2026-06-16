export type Priority = "high" | "medium" | "low";
export type TaskStatus = "todo" | "inprogress" | "done";
export type RecurringType = "none" | "daily" | "weekly" | "custom";
export type NoteColor = "white" | "yellow" | "green" | "blue" | "pink" | "purple";

export interface Category {
  id: string;
  name: string;
  color: string; // hex
}

export interface Task {
  id: string;
  title: string;
  status: TaskStatus;
  priority: Priority;
  categoryId: string;
  dueTime?: string;        // "14:30"
  note?: string;
  recurring: RecurringType;
  recurringDays?: number[]; // 0=Sun..6=Sat for custom
  createdAt: string;
  completedAt?: string;
  order: number;
}

export interface Note {
  id: string;
  title: string;
  body: string;
  categoryId: string;
  color: NoteColor;
  pinned: boolean;
  createdAt: string;
  updatedAt: string;
}
