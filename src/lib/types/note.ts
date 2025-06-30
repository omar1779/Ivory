export interface Note {
  id: string;
  title: string;
  content: string;
  folder: string;
  tags: string[];
  isPinned: boolean;
  isArchived: boolean;
  owner: string;
  createdAt: string;
  updatedAt: string;
}

export type NoteInput = Omit<Note, 'id' | 'createdAt' | 'updatedAt' | 'owner'>;
