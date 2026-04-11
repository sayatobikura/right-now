import { useState } from 'react';
import type { Note } from '../types';

interface NoteCardProps {
  note: Note;
  onUpdate: (id: string, updates: Partial<Note>) => void;
  onDelete: (id: string) => void;
  onTogglePin: (id: string) => void;
  onSelect: (note: Note) => void;
}

const CATEGORY_COLORS: Record<string, string> = {
  work: 'bg-accent/20 text-accent',
  personal: 'bg-success/20 text-success',
  ideas: 'bg-warning/20 text-warning',
  journal: 'bg-[#c084fc]/20 text-[#c084fc]',
  reference: 'bg-text-tertiary/20 text-text-secondary',
  learning: 'bg-[#22d3ee]/20 text-[#22d3ee]',
};

export default function NoteCard({ note, onDelete, onTogglePin, onSelect }: NoteCardProps) {
  const [confirmDelete, setConfirmDelete] = useState(false);

  const timeAgo = getTimeAgo(note.createdAt);

  return (
    <div
      onClick={() => onSelect(note)}
      className={`bg-surface-1 rounded-xl border border-border p-4 cursor-pointer hover:border-accent/50 transition-colors ${
        note.isPinned ? 'ring-1 ring-accent/30' : ''
      }`}
    >
      {/* Header: pin + actions */}
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-2">
          {note.isPinned && (
            <svg width="12" height="12" viewBox="0 0 16 16" fill="currentColor" className="text-accent shrink-0">
              <path d="M9.5 1.5L14.5 6.5L10 8L12 14L8 10L2 12L4 8L1.5 6.5L6.5 1.5L9.5 1.5Z" />
            </svg>
          )}
          {note.category && (
            <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${CATEGORY_COLORS[note.category] ?? 'bg-surface-2 text-text-secondary'}`}>
              {note.category}
            </span>
          )}
        </div>
        <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
          <button
            onClick={() => onTogglePin(note.id)}
            title={note.isPinned ? 'Unpin' : 'Pin'}
            className="p-1 text-text-tertiary hover:text-accent transition-colors"
          >
            <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M9.5 1.5L14.5 6.5L10 8L12 14L8 10L2 12L4 8L1.5 6.5L6.5 1.5L9.5 1.5Z" />
            </svg>
          </button>
          {confirmDelete ? (
            <div className="flex items-center gap-1">
              <button
                onClick={() => { onDelete(note.id); setConfirmDelete(false); }}
                className="text-[10px] text-danger px-1"
              >
                Yes
              </button>
              <button
                onClick={() => setConfirmDelete(false)}
                className="text-[10px] text-text-tertiary px-1"
              >
                No
              </button>
            </div>
          ) : (
            <button
              onClick={() => setConfirmDelete(true)}
              title="Delete"
              className="p-1 text-text-tertiary hover:text-danger transition-colors"
            >
              <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M2 4h12M5.5 4V2.5h5V4M6.5 7v4.5M9.5 7v4.5M3.5 4l.5 9.5h8l.5-9.5" />
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* Content */}
      <p className="text-sm text-text-primary whitespace-pre-wrap line-clamp-4 mb-3">
        {note.content}
      </p>

      {/* Tags */}
      {note.tags.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-2">
          {note.tags.map((tag) => (
            <span key={tag} className="bg-surface-2 text-text-tertiary text-[10px] px-1.5 py-0.5 rounded">
              #{tag}
            </span>
          ))}
        </div>
      )}

      {/* Timestamp */}
      <span className="text-[10px] text-text-tertiary">{timeAgo}</span>
    </div>
  );
}

function getTimeAgo(dateStr: string): string {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diff = now - then;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString([], { month: 'short', day: 'numeric' });
}
