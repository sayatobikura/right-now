import { useState, useMemo } from 'react';
import type { Note } from '../types';
import * as NoteService from '../services/NoteService';

interface CalendarViewProps {
  notes: Note[];
  onSelect: (note: Note) => void;
}

function getWeekDays(startDate: Date): string[] {
  const monday = new Date(startDate);
  const day = monday.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  monday.setDate(monday.getDate() + diff);

  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday);
    d.setDate(d.getDate() + i);
    return d.toISOString().split('T')[0];
  });
}

const DAY_NAMES = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

const PRIORITY_DOT: Record<string, string> = {
  high: 'bg-priority-high',
  medium: 'bg-priority-medium',
  low: 'bg-priority-low',
};

export default function CalendarView({ notes, onSelect }: CalendarViewProps) {
  const [weekOffset, setWeekOffset] = useState(0);

  const baseDate = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() + weekOffset * 7);
    return d;
  }, [weekOffset]);

  const weekDays = useMemo(() => getWeekDays(baseDate), [baseDate]);
  const todayStr = new Date().toISOString().split('T')[0];

  const overdue = useMemo(() => NoteService.getOverdueItems(notes), [notes]);

  const weekLabel = useMemo(() => {
    const start = new Date(weekDays[0]);
    const end = new Date(weekDays[6]);
    const opts: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric' };
    return `${start.toLocaleDateString([], opts)} — ${end.toLocaleDateString([], opts)}`;
  }, [weekDays]);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-text-primary">Calendar</h2>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setWeekOffset((w) => w - 1)}
            className="text-text-secondary hover:text-text-primary text-sm px-2 py-1"
          >
            &larr;
          </button>
          <button
            onClick={() => setWeekOffset(0)}
            className="text-xs text-accent hover:text-accent-hover px-2 py-1"
          >
            This week
          </button>
          <button
            onClick={() => setWeekOffset((w) => w + 1)}
            className="text-text-secondary hover:text-text-primary text-sm px-2 py-1"
          >
            &rarr;
          </button>
        </div>
      </div>

      <p className="text-xs text-text-secondary">{weekLabel}</p>

      {/* Overdue section */}
      {overdue.length > 0 && weekOffset === 0 && (
        <div className="bg-overdue-bg rounded-xl p-3 border border-overdue-border">
          <h3 className="text-xs font-medium text-danger mb-2">Overdue ({overdue.length})</h3>
          <div className="space-y-1">
            {overdue.slice(0, 5).map((n) => (
              <div
                key={n.id}
                onClick={() => onSelect(n)}
                className="text-xs text-text-primary truncate cursor-pointer hover:text-accent"
              >
                {n.content.slice(0, 40)}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Week grid */}
      <div className="grid grid-cols-7 gap-1">
        {DAY_NAMES.map((d) => (
          <div key={d} className="text-[10px] text-text-tertiary text-center font-medium py-1">
            {d}
          </div>
        ))}

        {weekDays.map((dateStr) => {
          const dayItems = NoteService.getItemsByDate(notes, dateStr);
          const isToday = dateStr === todayStr;
          const dayNum = new Date(dateStr).getDate();

          return (
            <div
              key={dateStr}
              className={`min-h-[80px] rounded-lg border p-1.5 ${
                isToday
                  ? 'border-accent bg-accent/5'
                  : 'border-border bg-surface-1'
              }`}
            >
              <div className={`text-[10px] font-medium mb-1 ${isToday ? 'text-accent' : 'text-text-secondary'}`}>
                {dayNum}
              </div>
              <div className="space-y-0.5">
                {dayItems.slice(0, 3).map((n) => (
                  <div
                    key={n.id}
                    onClick={() => onSelect(n)}
                    className="flex items-center gap-1 cursor-pointer group"
                  >
                    {n.priority && (
                      <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${PRIORITY_DOT[n.priority] ?? ''}`} />
                    )}
                    <span className="text-[9px] text-text-secondary truncate group-hover:text-accent">
                      {n.content.slice(0, 20)}
                    </span>
                  </div>
                ))}
                {dayItems.length > 3 && (
                  <span className="text-[9px] text-text-tertiary">+{dayItems.length - 3} more</span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
