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
  | "page";

export interface Block {
  id: string;
  type: BlockType;
  content: string;
  checked?: boolean;      // todo
  collapsed?: boolean;    // toggle
  indent: number;         // 0..4, replaces nested children
  linkedNoteId?: string;  // page block
}

export interface NoteGroup {
  id: string;
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
  groups: NoteGroup[];
  notes: Array<Pick<NoteDTO, "id" | "groupId" | "title" | "icon" | "order" | "isPublished">>;
}
