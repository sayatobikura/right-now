import type { Note } from '../types';
import ItemRow from './ItemRow';

interface TodayViewProps {
  todayItems: Note[];
  onComplete: (id: string) => void;
  onSelect: (note: Note) => void;
  overdueCount: number;
  dateString: string;
}

export default function TodayView({ todayItems, onComplete, onSelect, overdueCount, dateString }: TodayViewProps) {
  const today = new Date().toISOString().split('T')[0];
  const overdue = todayItems.filter((n) => n.deadline && n.deadline < today);
  const dueToday = todayItems.filter((n) => n.deadline === today);
  const rest = todayItems.filter(
    (n) => !(n.deadline && n.deadline < today) && n.deadline !== today
  );

  if (todayItems.length === 0) {
    return (
      <div className="text-center py-16">
        <div className="text-4xl mb-3">{'✨'}</div>
        <h3 className="text-lg font-medium text-text-primary mb-1">All clear today</h3>
        <p className="text-sm text-text-secondary">
          No tasks due. Capture something above to get started.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Greeting */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-text-primary">Today's Focus</h2>
          <p className="text-xs text-text-secondary">{dateString}</p>
        </div>
        {overdueCount > 0 && (
          <span className="bg-danger/15 text-danger text-xs font-medium px-2.5 py-1 rounded-full">
            {overdueCount} overdue
          </span>
        )}
      </div>

      {/* Overdue section */}
      {overdue.length > 0 && (
        <div>
          <h3 className="text-xs font-medium text-danger uppercase tracking-wide mb-2">Overdue</h3>
          <div className="space-y-2 bg-overdue-bg rounded-xl p-3 border border-overdue-border">
            {overdue.map((item) => (
              <ItemRow key={item.id} note={item} onComplete={onComplete} onSelect={onSelect} />
            ))}
          </div>
        </div>
      )}

      {/* Due today */}
      {dueToday.length > 0 && (
        <div>
          <h3 className="text-xs font-medium text-text-secondary uppercase tracking-wide mb-2">Due Today</h3>
          <div className="space-y-2">
            {dueToday.map((item) => (
              <ItemRow key={item.id} note={item} onComplete={onComplete} onSelect={onSelect} />
            ))}
          </div>
        </div>
      )}

      {/* Other priority items */}
      {rest.length > 0 && (
        <div>
          <h3 className="text-xs font-medium text-text-secondary uppercase tracking-wide mb-2">Priority</h3>
          <div className="space-y-2">
            {rest.map((item) => (
              <ItemRow key={item.id} note={item} onComplete={onComplete} onSelect={onSelect} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
