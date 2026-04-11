import type { Task, AISuggestion } from '../types';

interface UpNextProps {
  suggestions: AISuggestion[];
  tasks: Task[];
}

const PRIORITY_DOT: Record<string, string> = {
  high: 'bg-danger',
  medium: 'bg-warning',
  low: 'bg-accent',
};

export default function UpNext({ suggestions, tasks }: UpNextProps) {
  if (suggestions.length === 0) return null;

  const taskMap = new Map(tasks.map((t) => [t.id, t]));

  return (
    <div>
      <div className="flex items-center gap-2 mb-3">
        <h3 className="text-sm font-medium text-text-secondary">Up Next</h3>
        <span className="bg-surface-2 text-text-tertiary text-xs px-2 py-0.5 rounded-full">
          {suggestions.length}
        </span>
      </div>

      <div className="space-y-2">
        {suggestions.map((suggestion) => {
          const task = taskMap.get(suggestion.taskId);
          if (!task) return null;

          return (
            <div
              key={suggestion.taskId}
              className="bg-surface-1 rounded-lg border border-border p-3 flex items-start gap-3"
            >
              <span className="text-xs font-bold text-text-tertiary mt-0.5 w-5 text-center shrink-0">
                #{suggestion.rank}
              </span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className={`w-2 h-2 rounded-full shrink-0 ${PRIORITY_DOT[task.priority]}`} />
                  <span className="text-sm text-text-primary truncate">{task.title}</span>
                </div>
                <p className="text-xs text-text-tertiary italic truncate">
                  {suggestion.reasoning}
                </p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <span className="text-xs text-text-tertiary">
                  {task.category}
                </span>
                {task.deadline && (
                  <span className="text-xs text-text-tertiary">
                    {task.deadline}
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
