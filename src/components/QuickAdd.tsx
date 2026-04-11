import { useState } from 'react';
import type { Priority, Category } from '../types';

interface QuickAddProps {
  onAdd: (input: {
    title: string;
    priority: Priority;
    category: Category;
    deadline: string | null;
  }) => void;
}

const PRIORITIES: { value: Priority; label: string; color: string }[] = [
  { value: 'high', label: 'High', color: 'bg-danger' },
  { value: 'medium', label: 'Med', color: 'bg-warning' },
  { value: 'low', label: 'Low', color: 'bg-accent' },
];

const CATEGORIES: { value: Category; label: string }[] = [
  { value: 'work', label: 'Work' },
  { value: 'personal', label: 'Personal' },
  { value: 'self-dev', label: 'Self-Dev' },
];

export default function QuickAdd({ onAdd }: QuickAddProps) {
  const [title, setTitle] = useState('');
  const [isExpanded, setIsExpanded] = useState(false);
  const [priority, setPriority] = useState<Priority>('medium');
  const [category, setCategory] = useState<Category>('work');
  const [deadline, setDeadline] = useState('');

  const handleSubmit = () => {
    const trimmed = title.trim();
    if (!trimmed) return;
    onAdd({
      title: trimmed,
      priority,
      category,
      deadline: deadline || null,
    });
    setTitle('');
    setPriority('medium');
    setCategory('work');
    setDeadline('');
    setIsExpanded(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (!isExpanded && title.trim()) {
        handleSubmit();
      } else if (!isExpanded) {
        setIsExpanded(true);
      } else {
        handleSubmit();
      }
    }
    if (e.key === 'Escape') {
      setIsExpanded(false);
    }
  };

  return (
    <div className="bg-surface-1 rounded-xl border border-border p-4">
      <div className="flex gap-2">
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="What needs to get done?"
          className="flex-1 bg-surface-2 border border-border rounded-lg px-4 py-2.5 text-text-primary placeholder:text-text-tertiary focus:outline-none focus:border-accent text-sm"
        />
        <button
          onClick={() => {
            if (title.trim() && !isExpanded) {
              handleSubmit();
            } else {
              setIsExpanded(!isExpanded);
            }
          }}
          className="bg-accent hover:bg-accent-hover text-white px-4 py-2.5 rounded-lg transition-colors text-sm font-medium shrink-0"
        >
          {isExpanded ? 'Cancel' : '+'}
        </button>
      </div>

      {isExpanded && (
        <div className="mt-3 space-y-3">
          {/* Priority */}
          <div>
            <label className="text-xs text-text-tertiary mb-1.5 block">Priority</label>
            <div className="flex gap-2">
              {PRIORITIES.map((p) => (
                <button
                  key={p.value}
                  onClick={() => setPriority(p.value)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                    priority === p.value
                      ? 'bg-surface-2 text-text-primary border border-accent'
                      : 'text-text-secondary hover:text-text-primary border border-border'
                  }`}
                >
                  <span className={`w-2 h-2 rounded-full ${p.color}`} />
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          {/* Category */}
          <div>
            <label className="text-xs text-text-tertiary mb-1.5 block">Category</label>
            <div className="flex gap-2">
              {CATEGORIES.map((c) => (
                <button
                  key={c.value}
                  onClick={() => setCategory(c.value)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                    category === c.value
                      ? 'bg-surface-2 text-text-primary border border-accent'
                      : 'text-text-secondary hover:text-text-primary border border-border'
                  }`}
                >
                  {c.label}
                </button>
              ))}
            </div>
          </div>

          {/* Deadline */}
          <div>
            <label className="text-xs text-text-tertiary mb-1.5 block">Deadline</label>
            <input
              type="date"
              value={deadline}
              onChange={(e) => setDeadline(e.target.value)}
              className="bg-surface-2 border border-border rounded-lg px-3 py-1.5 text-text-primary text-xs focus:outline-none focus:border-accent"
            />
          </div>

          {/* Submit */}
          <button
            onClick={handleSubmit}
            disabled={!title.trim()}
            className="w-full bg-accent hover:bg-accent-hover disabled:opacity-40 text-white font-medium rounded-lg py-2 text-sm transition-colors"
          >
            Add Task
          </button>
        </div>
      )}
    </div>
  );
}
