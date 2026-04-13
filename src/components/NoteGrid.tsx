import type { Note } from '../types';
import NoteCard from './NoteCard';

interface NoteGridProps {
  notes: Note[];
  onUpdate: (id: string, updates: Partial<Note>) => void;
  onDelete: (id: string) => void;
  onTogglePin: (id: string) => void;
  onSelect: (note: Note) => void;
  onComplete: (id: string) => void;
}

export default function NoteGrid({ notes, onUpdate, onDelete, onTogglePin, onSelect, onComplete }: NoteGridProps) {
  const pinned = notes.filter((n) => n.isPinned);
  const unpinned = notes.filter((n) => !n.isPinned);

  const renderCard = (note: Note) => (
    <NoteCard
      key={note.id}
      note={note}
      onUpdate={onUpdate}
      onDelete={onDelete}
      onTogglePin={onTogglePin}
      onSelect={onSelect}
      onComplete={onComplete}
    />
  );

  return (
    <div>
      {pinned.length > 0 && (
        <>
          <h3 className="text-xs font-medium text-text-tertiary uppercase tracking-wide mb-2">Pinned</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
            {pinned.map(renderCard)}
          </div>
        </>
      )}
      {unpinned.length > 0 && (
        <>
          {pinned.length > 0 && (
            <h3 className="text-xs font-medium text-text-tertiary uppercase tracking-wide mb-2">Others</h3>
          )}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {unpinned.map(renderCard)}
          </div>
        </>
      )}
    </div>
  );
}
