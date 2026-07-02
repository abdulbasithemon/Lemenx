/** Notion-style notes: groups, notes, and block-based content. */

export type BlockType =
  | "text"
  | "todo"
  | "bulleted"
  | "numbered"
  | "toggle"
  | "h1"
  | "h2"
  | "h3"
  | "quote"
  | "divider"
  | "callout"
  | "code"
  | "toc"
  | "page"
  | "image"
  | "video"
  | "audio"
  | "file"
  | "pdf"
  | "bookmark"
  | "embed"
  | "equation"
  | "breadcrumb";

export interface Block {
  id: string;
  type: BlockType;
  /** Plain text or limited inline HTML (b/i/u/s/code/a) for text blocks; LaTeX for equation. */
  content: string;
  checked?: boolean;      // todo
  collapsed?: boolean;    // toggle
  indent: number;         // 0..4, replaces nested children
  linkedNoteId?: string;  // page block
  url?: string;           // media blocks: image/video/audio/file/pdf/bookmark/embed
}

/** Top level: a subject/area, e.g. "Discrete Mathematics". */
export interface NoteCategory {
  id: string;
  title: string;
  order: number;
  createdAt: string;
}

/** Second level: a section inside a category, e.g. "Class Lecture". */
export interface NoteGroup {
  id: string;
  categoryId: string;
  title: string;
  order: number;
  createdAt: string;
}

export interface NoteDoc {
  id: string;
  groupId: string;
  title: string;
  icon?: string;
  order: number;
  blocks: Block[];
  createdAt: string;
  updatedAt: string;
  isPublished: boolean;
  shareToken?: string;
  /** bcrypt hash — never sent to the client and never stores plaintext. */
  passwordHash?: string;
  publishedAt?: string;
}

/** Note shape as returned by the API (passwordHash stripped). */
export type NoteDTO = Omit<NoteDoc, "passwordHash"> & { hasPassword: boolean };

export interface NotesTreeData {
  categories: NoteCategory[];
  groups: NoteGroup[];
  notes: Array<Pick<NoteDTO, "id" | "groupId" | "title" | "icon" | "order" | "isPublished">>;
}
