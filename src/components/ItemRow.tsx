import type { Note } from '../types';

interface ItemRowProps {
  note: Note;
  onComplete: (id: string) => void;
  onSelect: (note: Note) => void;
}

const PRIORITY_STYLES: Record<string, string> = {
  high: 'bg-priority-high/15 text-priority-high',
  medium: 'bg-priority-medium/15 text-[#c9a045]',
  low: 'bg-priority-low/15 text-[#5aa67e]',
};

const TYPE_ICONS: Record<string, string> = {
  task: '\u2611',
  idea: '\u{1F4A1}',
  tip: '\u2B50',
  note: '\u{1F4DD}',
};

function getDeadlineLabel(deadline: string | null | undefined): { text: string; style: string } | null {
  if (!deadline) return null;
  const today = new Date().toISOString().split('T')[0];
  if (deadline < today) {
    const days = Math.ceil((Date.now() - new Date(deadline).getTime()) / 86400000);
    return { text: `${days}d overdue`, style: 'bg-overdue-bg text-danger border border-overdue-border' };
  }
  if (deadline === today) {
    return { text: 'Due today', style: 'bg-warning/10 text-[#c9a045]' };
  }
  const days = Math.ceil((new Date(deadline).getTime() - Date.now()) / 86400000);
  return { text: `in ${days}d`, style: 'bg-surface-2 text-text-secondary' };
}

export default function ItemRow({ note, onComplete, onSelect }: ItemRowProps) {
  const isTask = note.itemType === 'task';
  const isDone = note.status === 'done';
  const deadlineLabel = getDeadlineLabel(note.deadline);

  return (
    <div
      onClick={() => onSelect(note)}
      className={`flex items-center gap-3 px-4 py-3 bg-surface-1 rounded-xl border border-border cursor-pointer hover:border-accent/50 transition-colors ${isDone ? 'opacity-50' : ''}`}
    >
      {/* Checkbox for tasks */}
      {isTask && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            if (!isDone) onComplete(note.id);
          }}
          className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors ${
            isDone
              ? 'bg-success border-success text-white'
              : 'border-border hover:border-accent'
          }`}
        >
          {isDone && (
            <svg width="10" height="10" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="3">
              <path d="M2.5 8.5l3.5 3.5 7.5-8" />
            </svg>
          )}
        </button>
      )}

      {/* Type icon for non-tasks */}
      {!isTask && (
        <span className="text-sm shrink-0 w-5 text-center">{TYPE_ICONS[note.itemType ?? 'note']}</span>
      )}

      {/* Content */}
      <div className="flex-1 min-w-0">
        <p className={`text-sm truncate font-medium ${isDone ? 'line-through text-text-tertiary' : 'text-text-primary'}`}>
          {note.title || note.content}
        </p>
        {note.title && (
          <p className="text-xs text-text-secondary truncate mt-0.5">{note.content}</p>
        )}
      </div>

      {/* Badges */}
      <div className="flex items-center gap-1.5 shrink-0">
        {note.priority && (
          <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded ${PRIORITY_STYLES[note.priority]}`}>
            {note.priority}
          </span>
        )}
        {deadlineLabel && (
          <span className={`text-[10px] px-1.5 py-0.5 rounded ${deadlineLabel.style}`}>
            {deadlineLabel.text}
          </span>
        )}
        {note.category && (
          <span className="text-[10px] text-text-tertiary">{note.category}</span>
        )}
      </div>
    </div>
  );
}
