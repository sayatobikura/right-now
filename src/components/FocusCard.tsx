import type { Task, AISuggestion } from '../types';

interface FocusCardProps {
  suggestion: AISuggestion | null;
  task: Task | null;
  onComplete: (id: string) => void;
  onSkip: (id: string) => void;
  onRefresh: () => void;
  isLoading: boolean;
}

const PRIORITY_COLORS: Record<string, string> = {
  high: 'bg-danger/20 text-danger',
  medium: 'bg-warning/20 text-warning',
  low: 'bg-accent/20 text-accent',
};

const CATEGORY_LABELS: Record<string, string> = {
  work: 'Work',
  personal: 'Personal',
  'self-dev': 'Self-Dev',
};

function getDeadlineInfo(deadline: string | null): { text: string; color: string } | null {
  if (!deadline) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const deadlineDate = new Date(deadline + 'T00:00:00');
  const diffDays = Math.ceil(
    (deadlineDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
  );

  if (diffDays < 0) return { text: `${Math.abs(diffDays)}d overdue`, color: 'text-danger' };
  if (diffDays === 0) return { text: 'Due today', color: 'text-warning' };
  if (diffDays === 1) return { text: 'Due tomorrow', color: 'text-warning' };
  return { text: `Due in ${diffDays}d`, color: 'text-text-tertiary' };
}

export default function FocusCard({
  suggestion,
  task,
  onComplete,
  onSkip,
  onRefresh,
  isLoading,
}: FocusCardProps) {
  if (isLoading) {
    return (
      <div className="bg-surface-1 rounded-xl border-l-4 border-accent border border-border p-6">
        <div className="animate-pulse space-y-3">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-surface-2 rounded" />
            <div className="h-3 w-24 bg-surface-2 rounded" />
          </div>
          <div className="h-6 w-3/4 bg-surface-2 rounded" />
          <div className="h-4 w-full bg-surface-2 rounded" />
          <div className="flex gap-2 pt-2">
            <div className="h-8 w-20 bg-surface-2 rounded-lg" />
            <div className="h-8 w-20 bg-surface-2 rounded-lg" />
          </div>
        </div>
      </div>
    );
  }

  if (!suggestion || !task) {
    return (
      <div className="bg-surface-1 rounded-xl border border-border p-6 text-center">
        <p className="text-text-tertiary text-sm">
          Add tasks and let AI decide what's next
        </p>
        <button
          onClick={onRefresh}
          className="mt-3 text-accent hover:text-accent-hover text-sm transition-colors"
        >
          Refresh ranking
        </button>
      </div>
    );
  }

  const deadlineInfo = getDeadlineInfo(task.deadline);

  return (
    <div className="bg-surface-1 rounded-xl border-l-4 border-l-accent border border-border p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="text-accent">
            <path d="M8 1l2.5 5 5.5.8-4 3.9.9 5.3L8 13.3 3.1 16l.9-5.3-4-3.9L5.5 6z" fill="currentColor" />
          </svg>
          <span className="text-xs font-medium text-accent uppercase tracking-wide">
            Focus Now
          </span>
        </div>
        <button
          onClick={onRefresh}
          className="text-text-tertiary hover:text-text-primary transition-colors"
          title="Refresh ranking"
        >
          <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M1.5 8a6.5 6.5 0 0 1 11.3-4.4M14.5 8a6.5 6.5 0 0 1-11.3 4.4" />
            <path d="M13 1v3.5h-3.5M3 15v-3.5h3.5" />
          </svg>
        </button>
      </div>

      {/* Task title */}
      <h2 className="text-xl font-semibold text-text-primary mb-2">{task.title}</h2>

      {/* AI reasoning */}
      <p className="text-sm text-text-secondary italic mb-4">{suggestion.reasoning}</p>

      {/* Badges */}
      <div className="flex items-center gap-2 mb-4 flex-wrap">
        <span className={`px-2 py-0.5 rounded text-xs font-medium ${PRIORITY_COLORS[task.priority]}`}>
          {task.priority}
        </span>
        <span className="px-2 py-0.5 rounded text-xs font-medium bg-surface-2 text-text-secondary">
          {CATEGORY_LABELS[task.category]}
        </span>
        {deadlineInfo && (
          <span className={`text-xs ${deadlineInfo.color}`}>{deadlineInfo.text}</span>
        )}
      </div>

      {/* Actions */}
      <div className="flex gap-2">
        <button
          onClick={() => onComplete(task.id)}
          className="flex items-center gap-1.5 bg-success/10 hover:bg-success/20 text-success px-4 py-2 rounded-lg text-sm font-medium transition-colors"
        >
          <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M2.5 8.5l3.5 3.5 7.5-8" />
          </svg>
          Done
        </button>
        <button
          onClick={() => onSkip(task.id)}
          className="flex items-center gap-1.5 bg-surface-2 hover:bg-surface-2/80 text-text-secondary px-4 py-2 rounded-lg text-sm font-medium transition-colors"
        >
          <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M3 3l5 5-5 5M8 3l5 5-5 5" />
          </svg>
          Skip
        </button>
      </div>
    </div>
  );
}
