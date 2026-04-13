import { useState } from 'react';
import type { Note, ItemStatus } from '../types';
import ItemRow from './ItemRow';

interface InboxViewProps {
  items: Note[];
  onSetStatus: (id: string, status: ItemStatus) => void;
  onSchedule: (id: string, date: string) => void;
  onComplete: (id: string) => void;
  onSelect: (note: Note) => void;
}

const TYPE_LABELS: Record<string, string> = {
  task: 'Task',
  idea: 'Idea',
  tip: 'Tip',
  note: 'Note',
};

export default function InboxView({ items, onSetStatus, onSchedule, onComplete, onSelect }: InboxViewProps) {
  const [schedulingId, setSchedulingId] = useState<string | null>(null);

  if (items.length === 0) {
    return (
      <div className="text-center py-16">
        <div className="text-4xl mb-3">{'📥'}</div>
        <h3 className="text-lg font-medium text-text-primary mb-1">Inbox empty</h3>
        <p className="text-sm text-text-secondary">
          New captures appear here for you to triage.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-text-primary">Inbox</h2>
        <span className="bg-accent/15 text-accent text-xs font-medium px-2.5 py-1 rounded-full">
          {items.length} to review
        </span>
      </div>

      <div className="space-y-2">
        {items.map((item) => (
          <div key={item.id} className="space-y-1">
            <ItemRow note={item} onComplete={onComplete} onSelect={onSelect} />

            {/* Quick actions */}
            <div className="flex items-center gap-2 pl-8" onClick={(e) => e.stopPropagation()}>
              <span className="text-[10px] text-text-tertiary">
                AI: {TYPE_LABELS[item.itemType ?? 'note']}
              </span>
              <div className="flex-1" />
              <button
                onClick={() => onSetStatus(item.id, 'active')}
                className="text-[10px] text-accent hover:text-accent-hover px-2 py-0.5 rounded hover:bg-accent/10 transition-colors"
              >
                Activate
              </button>
              <button
                onClick={() => setSchedulingId(schedulingId === item.id ? null : item.id)}
                className="text-[10px] text-text-secondary hover:text-text-primary px-2 py-0.5 rounded hover:bg-surface-2 transition-colors"
              >
                Schedule
              </button>
              <button
                onClick={() => onSetStatus(item.id, 'archived')}
                className="text-[10px] text-text-tertiary hover:text-text-secondary px-2 py-0.5 rounded hover:bg-surface-2 transition-colors"
              >
                Archive
              </button>
            </div>

            {/* Schedule picker */}
            {schedulingId === item.id && (
              <div className="pl-8 flex items-center gap-2">
                <input
                  type="date"
                  onChange={(e) => {
                    if (e.target.value) {
                      onSchedule(item.id, e.target.value);
                      setSchedulingId(null);
                    }
                  }}
                  className="bg-surface-2 border border-border rounded px-2 py-1 text-xs text-text-primary focus:outline-none focus:border-accent"
                />
                <button
                  onClick={() => {
                    onSchedule(item.id, new Date().toISOString().split('T')[0]);
                    setSchedulingId(null);
                  }}
                  className="text-[10px] text-accent hover:text-accent-hover"
                >
                  Today
                </button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
