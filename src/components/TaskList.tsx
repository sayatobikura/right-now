import { useState } from 'react';
import type { Task } from '../types';

type Filter = 'all' | 'open' | 'completed' | 'skipped';

interface TaskListProps {
  tasks: Task[];
  onUpdate: (id: string, updates: Partial<Task>) => void;
  onDelete: (id: string) => void;
  onComplete: (id: string) => void;
  onSkip: (id: string) => void;
  onReopen: (id: string) => void;
}

const PRIORITY_DOT: Record<string, string> = {
  high: 'bg-danger',
  medium: 'bg-warning',
  low: 'bg-accent',
};

const CATEGORY_LABELS: Record<string, string> = {
  work: 'Work',
  personal: 'Personal',
  'self-dev': 'Self-Dev',
};

export default function TaskList({
  tasks,
  onDelete,
  onComplete,
  onSkip,
  onReopen,
}: TaskListProps) {
  const [filter, setFilter] = useState<Filter>('all');
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  const filtered = tasks
    .filter((t) => filter === 'all' || t.status === filter)
    .sort((a, b) => {
      if (a.status === 'open' && b.status !== 'open') return -1;
      if (a.status !== 'open' && b.status === 'open') return 1;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

  const counts: Record<Filter, number> = {
    all: tasks.length,
    open: tasks.filter((t) => t.status === 'open').length,
    completed: tasks.filter((t) => t.status === 'completed').length,
    skipped: tasks.filter((t) => t.status === 'skipped').length,
  };

  const FILTERS: { value: Filter; label: string }[] = [
    { value: 'all', label: 'All' },
    { value: 'open', label: 'Open' },
    { value: 'completed', label: 'Done' },
    { value: 'skipped', label: 'Skipped' },
  ];

  return (
    <div>
      {/* Filter tabs */}
      <div className="flex gap-1 mb-4 bg-surface-1 rounded-lg p-1 border border-border">
        {FILTERS.map((f) => (
          <button
            key={f.value}
            onClick={() => setFilter(f.value)}
            className={`flex-1 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
              filter === f.value
                ? 'bg-accent text-white'
                : 'text-text-secondary hover:text-text-primary'
            }`}
          >
            {f.label}
            <span className="ml-1 opacity-60">{counts[f.value]}</span>
          </button>
        ))}
      </div>

      {/* Task list */}
      {filtered.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-text-tertiary text-sm">No {filter === 'all' ? '' : filter} tasks</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((task) => (
            <div
              key={task.id}
              className={`bg-surface-1 rounded-lg border border-border p-4 ${
                task.status !== 'open' ? 'opacity-60' : ''
              }`}
            >
              <div className="flex items-start gap-3">
                {/* Priority dot */}
                <span className={`w-2.5 h-2.5 rounded-full mt-1.5 shrink-0 ${PRIORITY_DOT[task.priority]}`} />

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <p
                    className={`text-sm font-medium ${
                      task.status === 'completed'
                        ? 'line-through text-text-tertiary'
                        : 'text-text-primary'
                    }`}
                  >
                    {task.title}
                  </p>
                  <div className="flex items-center gap-2 mt-1 flex-wrap">
                    <span className="text-xs text-text-tertiary">
                      {CATEGORY_LABELS[task.category]}
                    </span>
                    {task.deadline && (
                      <span className="text-xs text-text-tertiary">
                        Due: {task.deadline}
                      </span>
                    )}
                    <span className="text-xs text-text-tertiary capitalize">
                      {task.priority}
                    </span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1 shrink-0">
                  {task.status === 'open' && (
                    <>
                      <button
                        onClick={() => onComplete(task.id)}
                        title="Complete"
                        className="p-1.5 text-text-tertiary hover:text-success transition-colors"
                      >
                        <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M2.5 8.5l3.5 3.5 7.5-8" />
                        </svg>
                      </button>
                      <button
                        onClick={() => onSkip(task.id)}
                        title="Skip"
                        className="p-1.5 text-text-tertiary hover:text-warning transition-colors"
                      >
                        <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
                          <path d="M3 3l5 5-5 5M8 3l5 5-5 5" />
                        </svg>
                      </button>
                    </>
                  )}
                  {task.status !== 'open' && (
                    <button
                      onClick={() => onReopen(task.id)}
                      title="Reopen"
                      className="p-1.5 text-text-tertiary hover:text-accent transition-colors text-xs"
                    >
                      <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
                        <path d="M1.5 8a6.5 6.5 0 0 1 11.3-4.4M14.5 8a6.5 6.5 0 0 1-11.3 4.4" />
                        <path d="M13 1v3.5h-3.5M3 15v-3.5h3.5" />
                      </svg>
                    </button>
                  )}
                  {confirmDelete === task.id ? (
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => {
                          onDelete(task.id);
                          setConfirmDelete(null);
                        }}
                        className="text-xs text-danger hover:text-danger/80 px-1.5 py-0.5"
                      >
                        Yes
                      </button>
                      <button
                        onClick={() => setConfirmDelete(null)}
                        className="text-xs text-text-tertiary hover:text-text-secondary px-1.5 py-0.5"
                      >
                        No
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setConfirmDelete(task.id)}
                      title="Delete"
                      className="p-1.5 text-text-tertiary hover:text-danger transition-colors"
                    >
                      <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
                        <path d="M2 4h12M5.5 4V2.5h5V4M6.5 7v4.5M9.5 7v4.5M3.5 4l.5 9.5h8l.5-9.5" />
                      </svg>
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
