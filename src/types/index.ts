export type AIProvider = 'claude' | 'openai';
export type AppView = 'notes' | 'journal';

export interface Note {
  id: string;
  content: string;
  tags: string[];
  category: string | null;
  isPinned: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface AIOrganizeResult {
  tags: string[];
  category: string;
}

export interface AIConnectionResult {
  noteId: string;
  reason: string;
}

export type NoteAction =
  | { type: 'ADD_NOTE'; note: Note }
  | { type: 'UPDATE_NOTE'; id: string; updates: Partial<Omit<Note, 'id' | 'createdAt'>> }
  | { type: 'DELETE_NOTE'; id: string }
  | { type: 'TOGGLE_PIN'; id: string }
  | { type: 'LOAD_NOTES'; notes: Note[] };
