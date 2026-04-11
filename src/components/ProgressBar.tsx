interface ProgressBarProps {
  total: number;
  completed: number;
}

export default function ProgressBar({ total, completed }: ProgressBarProps) {
  if (total === 0) {
    return (
      <div className="bg-surface-1 rounded-lg border border-border px-4 py-3">
        <span className="text-xs text-text-tertiary">No tasks for today</span>
      </div>
    );
  }

  const pct = Math.round((completed / total) * 100);

  return (
    <div className="bg-surface-1 rounded-lg border border-border px-4 py-3">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs text-text-secondary">
          Today: {completed}/{total} completed
        </span>
        <span className="text-xs text-text-tertiary">{pct}%</span>
      </div>
      <div className="h-1.5 bg-surface-2 rounded-full overflow-hidden">
        <div
          className="h-full bg-accent rounded-full transition-all duration-300"
          style={{ width: `${pct}%`, minWidth: completed > 0 ? '8px' : '0' }}
        />
      </div>
    </div>
  );
}
