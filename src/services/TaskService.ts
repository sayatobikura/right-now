import type { Task, Priority, Category } from '../types';

const TASKS_KEY = 'rightnow_tasks';

export function loadTasks(): Task[] {
  try {
    const raw = localStorage.getItem(TASKS_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as Task[];
  } catch {
    return [];
  }
}

export function saveTasks(tasks: Task[]): void {
  localStorage.setItem(TASKS_KEY, JSON.stringify(tasks));
}

export function createTask(input: {
  title: string;
  priority: Priority;
  category: Category;
  deadline: string | null;
}): Task {
  return {
    id: crypto.randomUUID(),
    title: input.title,
    priority: input.priority,
    category: input.category,
    status: 'open',
    deadline: input.deadline,
    createdAt: new Date().toISOString(),
    completedAt: null,
  };
}

export function getOpenTasks(tasks: Task[]): Task[] {
  return tasks.filter((t) => t.status === 'open');
}

export function getCompletedToday(tasks: Task[]): Task[] {
  const todayStr = new Date().toLocaleDateString();
  return tasks.filter(
    (t) =>
      t.status === 'completed' &&
      t.completedAt &&
      new Date(t.completedAt).toLocaleDateString() === todayStr
  );
}

export function getTodayStats(tasks: Task[]): {
  total: number;
  completed: number;
} {
  const openTasks = getOpenTasks(tasks);
  const completedToday = getCompletedToday(tasks);
  return {
    total: openTasks.length + completedToday.length,
    completed: completedToday.length,
  };
}
