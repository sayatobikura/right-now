import type { Note } from '../types';

const NOTES_KEY = 'rightnow_notes';

export function loadNotes(): Note[] {
  try {
    const raw = localStorage.getItem(NOTES_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as Note[];
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
  };
}

export function getAllTags(notes: Note[]): string[] {
  const tagSet = new Set<string>();
  for (const note of notes) {
    for (const tag of note.tags) {
      tagSet.add(tag);
    }
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
