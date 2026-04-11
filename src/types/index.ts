export type Priority = 'high' | 'medium' | 'low';
export type Category = 'work' | 'personal' | 'self-dev';
export type TaskStatus = 'open' | 'completed' | 'skipped';
export type AppView = 'dashboard' | 'tasks';

export interface Task {
  id: string;
  title: string;
  priority: Priority;
  category: Category;
  status: TaskStatus;
  deadline: string | null;
  createdAt: string;
  completedAt: string | null;
}

export interface AISuggestion {
  taskId: string;
  reasoning: string;
  rank: number;
}

export interface AIRankingResult {
  suggestions: AISuggestion[];
  rankedAt: string;
  error: string | null;
}

export type TaskAction =
  | { type: 'ADD_TASK'; task: Task }
  | { type: 'UPDATE_TASK'; id: string; updates: Partial<Omit<Task, 'id' | 'createdAt'>> }
  | { type: 'DELETE_TASK'; id: string }
  | { type: 'COMPLETE_TASK'; id: string }
  | { type: 'SKIP_TASK'; id: string }
  | { type: 'REOPEN_TASK'; id: string }
  | { type: 'LOAD_TASKS'; tasks: Task[] };
