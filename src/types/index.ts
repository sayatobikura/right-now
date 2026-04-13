export type AIProvider = 'claude' | 'openai';
export type AppView = 'today' | 'inbox' | 'notes' | 'calendar';
export type ItemType = 'note' | 'task' | 'idea' | 'tip';
export type Priority = 'high' | 'medium' | 'low';
export type ItemStatus = 'inbox' | 'active' | 'done' | 'archived';

export interface Note {
  id: string;
  content: string;
  tags: string[];
  category: string | null;
  isPinned: boolean;
  createdAt: string;
  updatedAt: string;
  // GTD fields (optional for backward compat)
  itemType?: ItemType;
  priority?: Priority | null;
  deadline?: string | null;
  status?: ItemStatus;
  scheduledDate?: string | null;
  completedAt?: string | null;
}

export interface AIOrganizeResult {
  tags: string[];
  category: string;
  type?: ItemType;
  priority?: Priority | null;
  deadline?: string | null;
  deadlineReason?: string | null;
  suggestedSchedule?: string | null;
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
  | { type: 'COMPLETE_ITEM'; id: string }
  | { type: 'SET_STATUS'; id: string; status: ItemStatus }
  | { type: 'SCHEDULE_ITEM'; id: string; scheduledDate: string }
  | { type: 'LOAD_NOTES'; notes: Note[] };
