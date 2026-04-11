import type { Note } from '../types';
import * as NoteService from '../services/NoteService';

interface JournalViewProps {
  notes: Note[];
  onSelect: (note: Note) => void;
}

export default function JournalView({ notes, onSelect }: JournalViewProps) {
  const grouped = NoteService.groupByDate(notes);

  if (notes.length === 0) {
    return (
      <div className="text-center py-16">
        <p className="text-text-tertiary text-sm">No journal entries yet</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {Array.from(grouped.entries()).map(([dateLabel, dayNotes]) => (
        <div key={dateLabel}>
          <h3 className="text-sm font-medium text-text-secondary mb-3 sticky top-0 bg-surface-0 py-1">
            {dateLabel}
          </h3>
          <div className="space-y-2 border-l-2 border-border pl-4">
            {dayNotes
              .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
              .map((note) => (
                <div
                  key={note.id}
                  onClick={() => onSelect(note)}
                  className="bg-surface-1 rounded-lg border border-border p-3 cursor-pointer hover:border-accent/50 transition-colors"
                >
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[10px] text-text-tertiary">
                      {new Date(note.createdAt).toLocaleTimeString([], {
                        hour: 'numeric',
                        minute: '2-digit',
                      })}
                    </span>
                    {note.category && (
                      <span className="text-[10px] text-accent font-medium">{note.category}</span>
                    )}
                  </div>
                  <p className="text-sm text-text-primary whitespace-pre-wrap line-clamp-3">
                    {note.content}
                  </p>
                  {note.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {note.tags.map((tag) => (
                        <span key={tag} className="text-[10px] text-text-tertiary">
                          #{tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              ))}
          </div>
        </div>
      ))}
    </div>
  );
}
