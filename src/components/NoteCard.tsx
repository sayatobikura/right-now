import { useState } from 'react';
import type { Note } from '../types';

interface NoteCardProps {
  note: Note;
  onUpdate: (id: string, updates: Partial<Note>) => void;
  onDelete: (id: string) => void;
  onTogglePin: (id: string) => void;
  onSelect: (note: Note) => void;
  onComplete: (id: string) => void;
}

const CATEGORY_COLORS: Record<string, string> = {
  work: 'bg-[#8bb8d9]/20 text-[#6a9bc4]',
  personal: 'bg-[#7cc9a0]/20 text-[#5aa67e]',
  ideas: 'bg-[#f0c674]/20 text-[#c9a045]',
  journal: 'bg-[#b8a9d4]/20 text-[#8a7bb0]',
  reference: 'bg-[#a8c8e8]/20 text-[#6a9bc4]',
  learning: 'bg-[#f4b8a0]/20 text-[#d08870]',
};

const PRIORITY_BORDER: Record<string, string> = {
  high: 'border-l-priority-high',
  medium: 'border-l-priority-medium',
  low: 'border-l-priority-low',
};

const TYPE_ICONS: Record<string, string> = {
  task: '\u2611',
  idea: '\u{1F4A1}',
  tip: '\u2B50',
  note: '',
};

export default function NoteCard({ note, onDelete, onTogglePin, onSelect, onComplete }: NoteCardProps) {
  const [confirmDelete, setConfirmDelete] = useState(false);
  const isDone = note.status === 'done';
  const isTask = note.itemType === 'task';
  const hasPriority = note.priority && PRIORITY_BORDER[note.priority];

  return (
    <div
      onClick={() => onSelect(note)}
      className={`bg-surface-1 rounded-xl border border-border p-4 cursor-pointer hover:border-accent/50 transition-colors ${
        note.isPinned ? 'ring-1 ring-accent/30' : ''
      } ${hasPriority ? `border-l-[3px] ${PRIORITY_BORDER[note.priority!]}` : ''} ${isDone ? 'opacity-50' : ''}`}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-1.5">
          {isTask && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                if (!isDone) onComplete(note.id);
              }}
              className={`w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 ${
                isDone ? 'bg-success border-success text-white' : 'border-text-tertiary hover:border-accent'
              }`}
            >
              {isDone && (
                <svg width="8" height="8" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="3">
                  <path d="M2.5 8.5l3.5 3.5 7.5-8" />
                </svg>
              )}
            </button>
          )}
          {!isTask && TYPE_ICONS[note.itemType ?? 'note'] && (
            <span className="text-xs">{TYPE_ICONS[note.itemType ?? 'note']}</span>
          )}
          {note.category && (
            <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${CATEGORY_COLORS[note.category] ?? 'bg-surface-2 text-text-secondary'}`}>
              {note.category}
            </span>
          )}
          {note.priority && (
            <span className={`text-[10px] font-medium px-1 py-0.5 rounded ${
              note.priority === 'high' ? 'bg-priority-high/15 text-priority-high' :
              note.priority === 'medium' ? 'bg-priority-medium/15 text-[#c9a045]' :
              'bg-priority-low/15 text-[#5aa67e]'
            }`}>
              {note.priority}
            </span>
          )}
        </div>
        <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
          <button onClick={() => onTogglePin(note.id)} title={note.isPinned ? 'Unpin' : 'Pin'}
            className="p-1 text-text-tertiary hover:text-accent transition-colors">
            <svg width="12" height="12" viewBox="0 0 16 16" fill={note.isPinned ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="1.5">
              <path d="M9.5 1.5L14.5 6.5L10 8L12 14L8 10L2 12L4 8L1.5 6.5L6.5 1.5L9.5 1.5Z" />
            </svg>
          </button>
          {confirmDelete ? (
            <div className="flex items-center gap-1">
              <button onClick={() => { onDelete(note.id); setConfirmDelete(false); }} className="text-[10px] text-danger px-1">Yes</button>
              <button onClick={() => setConfirmDelete(false)} className="text-[10px] text-text-tertiary px-1">No</button>
            </div>
          ) : (
            <button onClick={() => setConfirmDelete(true)} title="Delete"
              className="p-1 text-text-tertiary hover:text-danger transition-colors">
              <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M2 4h12M5.5 4V2.5h5V4M6.5 7v4.5M9.5 7v4.5M3.5 4l.5 9.5h8l.5-9.5" />
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* Title + Description */}
      {note.title && (
        <p className={`text-sm font-medium mb-1 ${isDone ? 'line-through text-text-tertiary' : 'text-text-primary'}`}>
          {note.title}
        </p>
      )}
      <p className={`text-xs whitespace-pre-wrap line-clamp-3 mb-2 ${isDone ? 'line-through text-text-tertiary' : note.title ? 'text-text-secondary' : 'text-text-primary text-sm'}`}>
        {note.content}
      </p>

      {/* Deadline */}
      {note.deadline && (
        <div className="mb-2">
          <DeadlineBadge deadline={note.deadline} />
        </div>
      )}

      {/* Tags */}
      {note.tags.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-2">
          {note.tags.map((tag) => (
            <span key={tag} className="bg-surface-2 text-text-tertiary text-[10px] px-1.5 py-0.5 rounded">#{tag}</span>
          ))}
        </div>
      )}

      {/* Timestamp */}
      <span className="text-[10px] text-text-tertiary">{timeAgo(note.createdAt)}</span>
    </div>
  );
}

function DeadlineBadge({ deadline }: { deadline: string }) {
  const today = new Date().toISOString().split('T')[0];
  if (deadline < today) {
    const days = Math.ceil((Date.now() - new Date(deadline).getTime()) / 86400000);
    return <span className="text-[10px] bg-overdue-bg text-danger border border-overdue-border px-1.5 py-0.5 rounded">{days}d overdue</span>;
  }
  if (deadline === today) {
    return <span className="text-[10px] bg-warning/10 text-[#c9a045] px-1.5 py-0.5 rounded">Due today</span>;
  }
  const days = Math.ceil((new Date(deadline).getTime() - Date.now()) / 86400000);
  return <span className="text-[10px] bg-surface-2 text-text-secondary px-1.5 py-0.5 rounded">Due in {days}d</span>;
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString([], { month: 'short', day: 'numeric' });
}
