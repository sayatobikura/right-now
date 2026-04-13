import type { Note } from '../types';

const NOTES_KEY = 'rightnow_notes';

// Migrate old notes that lack new GTD fields
export function migrateNote(note: Partial<Note>): Note {
  return {
    id: note.id ?? crypto.randomUUID(),
    content: note.content ?? '',
    tags: note.tags ?? [],
    category: note.category ?? null,
    isPinned: note.isPinned ?? false,
    createdAt: note.createdAt ?? new Date().toISOString(),
    updatedAt: note.updatedAt ?? new Date().toISOString(),
    itemType: note.itemType ?? 'note',
    priority: note.priority ?? null,
    deadline: note.deadline ?? null,
    status: note.status ?? 'active',
    scheduledDate: note.scheduledDate ?? null,
    completedAt: note.completedAt ?? null,
  };
}

export function loadNotes(): Note[] {
  try {
    const raw = localStorage.getItem(NOTES_KEY);
    if (!raw) return [];
    return (JSON.parse(raw) as Partial<Note>[]).map(migrateNote);
  } catch {
    return [];
  }
}

export function saveNotes(notes: Note[]): void {
  localStorage.setItem(NOTES_KEY, JSON.stringify(notes));
}

export function createNote(content: string): Note {
  const now = new Date().toISOString();
  return {
    id: crypto.randomUUID(),
    content,
    tags: [],
    category: null,
    isPinned: false,
    createdAt: now,
    updatedAt: now,
    itemType: 'note',
    priority: null,
    deadline: null,
    status: 'inbox',
    scheduledDate: null,
    completedAt: null,
  };
}

// ── Query helpers ──

function todayStr(): string {
  return new Date().toISOString().split('T')[0];
}

export function getInboxItems(notes: Note[]): Note[] {
  return notes.filter((n) => (n.status ?? 'active') === 'inbox');
}

export function getOverdueItems(notes: Note[]): Note[] {
  const today = todayStr();
  return notes.filter(
    (n) =>
      n.deadline &&
      n.deadline < today &&
      (n.status ?? 'active') !== 'done' &&
      (n.status ?? 'active') !== 'archived'
  );
}

export function getTodayItems(notes: Note[]): Note[] {
  const today = todayStr();
  return notes.filter((n) => {
    const status = n.status ?? 'active';
    if (status === 'done' || status === 'archived') return false;
    // Overdue
    if (n.deadline && n.deadline < today) return true;
    // Due today
    if (n.deadline && n.deadline === today) return true;
    // Scheduled today
    if (n.scheduledDate && n.scheduledDate <= today) return true;
    // High priority active tasks with no specific date
    if (n.itemType === 'task' && n.priority === 'high' && status === 'active') return true;
    return false;
  });
}

export function getUpcomingItems(notes: Note[], days: number): Note[] {
  const today = new Date();
  const future = new Date(today);
  future.setDate(future.getDate() + days);
  const futureStr = future.toISOString().split('T')[0];
  const todayS = todayStr();
  return notes.filter((n) => {
    const status = n.status ?? 'active';
    if (status === 'done' || status === 'archived') return false;
    const date = n.deadline || n.scheduledDate;
    return date != null && date > todayS && date <= futureStr;
  });
}

// Today's Focus ranking algorithm
export function sortByPriority(notes: Note[]): Note[] {
  const today = todayStr();
  const hour = new Date().getHours();
  const isWorkHours = hour >= 9 && hour < 17;

  const priorityWeight = { high: 3, medium: 2, low: 1 };

  return [...notes].sort((a, b) => {
    // 1. Overdue first (most overdue → least)
    const aOverdue = a.deadline && a.deadline < today;
    const bOverdue = b.deadline && b.deadline < today;
    if (aOverdue && !bOverdue) return -1;
    if (!aOverdue && bOverdue) return 1;
    if (aOverdue && bOverdue) return a.deadline! < b.deadline! ? -1 : 1;

    // 2. Due today before future
    const aDueToday = a.deadline === today;
    const bDueToday = b.deadline === today;
    if (aDueToday && !bDueToday) return -1;
    if (!aDueToday && bDueToday) return 1;

    // 3. Scheduled today
    const aScheduled = a.scheduledDate && a.scheduledDate <= today;
    const bScheduled = b.scheduledDate && b.scheduledDate <= today;
    if (aScheduled && !bScheduled) return -1;
    if (!aScheduled && bScheduled) return 1;

    // 4. Priority (high > medium > low > null)
    const aPri = a.priority ? priorityWeight[a.priority] : 0;
    const bPri = b.priority ? priorityWeight[b.priority] : 0;
    if (aPri !== bPri) return bPri - aPri;

    // 5. Time-of-day context tiebreaker
    if (isWorkHours) {
      if (a.category === 'work' && b.category !== 'work') return -1;
      if (a.category !== 'work' && b.category === 'work') return 1;
    } else {
      if (a.category === 'personal' && b.category !== 'personal') return -1;
      if (a.category !== 'personal' && b.category === 'personal') return 1;
    }

    return 0;
  });
}

// ── Existing helpers ──

export function getAllTags(notes: Note[]): string[] {
  const tagSet = new Set<string>();
  for (const note of notes) {
    for (const tag of note.tags) tagSet.add(tag);
  }
  return Array.from(tagSet).sort();
}

export function getAllCategories(notes: Note[]): string[] {
  const catSet = new Set<string>();
  for (const note of notes) {
    if (note.category) catSet.add(note.category);
  }
  return Array.from(catSet).sort();
}

export function groupByDate(notes: Note[]): Map<string, Note[]> {
  const groups = new Map<string, Note[]>();
  for (const note of notes) {
    const dateKey = new Date(note.createdAt).toLocaleDateString([], {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
    const existing = groups.get(dateKey) ?? [];
    existing.push(note);
    groups.set(dateKey, existing);
  }
  return groups;
}

export function searchNotes(notes: Note[], query: string): Note[] {
  const lower = query.toLowerCase();
  return notes.filter(
    (n) =>
      n.content.toLowerCase().includes(lower) ||
      n.tags.some((t) => t.toLowerCase().includes(lower)) ||
      (n.category && n.category.toLowerCase().includes(lower))
  );
}

export function getItemsByDate(notes: Note[], dateStr: string): Note[] {
  return notes.filter((n) => {
    const status = n.status ?? 'active';
    if (status === 'done' || status === 'archived') return false;
    return n.deadline === dateStr || n.scheduledDate === dateStr;
  });
}
