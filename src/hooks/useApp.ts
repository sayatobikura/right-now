import { useReducer, useEffect, useRef, useState, useCallback, useMemo } from 'react';
import type { Task, TaskAction, Priority, Category, AIRankingResult, AISuggestion, AIProvider } from '../types';
import * as TaskService from '../services/TaskService';
import * as AIService from '../services/AIService';
import * as SettingsService from '../services/SettingsService';

// ── useTasks ──

function taskReducer(state: Task[], action: TaskAction): Task[] {
  switch (action.type) {
    case 'ADD_TASK':
      return [action.task, ...state];
    case 'UPDATE_TASK':
      return state.map((t) =>
        t.id === action.id ? { ...t, ...action.updates } : t
      );
    case 'DELETE_TASK':
      return state.filter((t) => t.id !== action.id);
    case 'COMPLETE_TASK':
      return state.map((t) =>
        t.id === action.id
          ? { ...t, status: 'completed' as const, completedAt: new Date().toISOString() }
          : t
      );
    case 'SKIP_TASK':
      return state.map((t) =>
        t.id === action.id ? { ...t, status: 'skipped' as const } : t
      );
    case 'REOPEN_TASK':
      return state.map((t) =>
        t.id === action.id
          ? { ...t, status: 'open' as const, completedAt: null }
          : t
      );
    case 'LOAD_TASKS':
      return action.tasks;
    default:
      return state;
  }
}

export function useTasks() {
  const [tasks, dispatch] = useReducer(taskReducer, []);
  const isInitialized = useRef(false);

  useEffect(() => {
    const loaded = TaskService.loadTasks();
    dispatch({ type: 'LOAD_TASKS', tasks: loaded });
    isInitialized.current = true;
  }, []);

  useEffect(() => {
    if (isInitialized.current) {
      TaskService.saveTasks(tasks);
    }
  }, [tasks]);

  const addTask = useCallback(
    (input: { title: string; priority: Priority; category: Category; deadline: string | null }) => {
      const task = TaskService.createTask(input);
      dispatch({ type: 'ADD_TASK', task });
    },
    []
  );

  const updateTask = useCallback(
    (id: string, updates: Partial<Omit<Task, 'id' | 'createdAt'>>) => {
      dispatch({ type: 'UPDATE_TASK', id, updates });
    },
    []
  );

  const deleteTask = useCallback((id: string) => {
    dispatch({ type: 'DELETE_TASK', id });
  }, []);

  const completeTask = useCallback((id: string) => {
    dispatch({ type: 'COMPLETE_TASK', id });
  }, []);

  const skipTask = useCallback((id: string) => {
    dispatch({ type: 'SKIP_TASK', id });
  }, []);

  const reopenTask = useCallback((id: string) => {
    dispatch({ type: 'REOPEN_TASK', id });
  }, []);

  const openTasks = useMemo(() => TaskService.getOpenTasks(tasks), [tasks]);
  const todayStats = useMemo(() => TaskService.getTodayStats(tasks), [tasks]);

  return {
    tasks,
    addTask,
    updateTask,
    deleteTask,
    completeTask,
    skipTask,
    reopenTask,
    openTasks,
    todayStats,
  };
}

// ── useAI ──

export function useAI() {
  const [ranking, setRanking] = useState<AIRankingResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const loadingRef = useRef(false);

  const fetchRanking = useCallback(async (tasks: Task[], apiKey: string, provider: AIProvider) => {
    if (loadingRef.current) return;
    loadingRef.current = true;
    setIsLoading(true);
    const result = await AIService.rankTasks(tasks, apiKey, provider);
    setRanking(result);
    setIsLoading(false);
    loadingRef.current = false;
  }, []);

  const clearRanking = useCallback(() => {
    setRanking(null);
  }, []);

  const focusSuggestion: AISuggestion | null = useMemo(
    () => ranking?.suggestions.find((s) => s.rank === 1) ?? ranking?.suggestions[0] ?? null,
    [ranking]
  );

  const upNextSuggestions: AISuggestion[] = useMemo(
    () => (ranking?.suggestions.filter((s) => s !== focusSuggestion).slice(0, 5) ?? []),
    [ranking, focusSuggestion]
  );

  return {
    ranking,
    isLoading,
    error: ranking?.error ?? null,
    fetchRanking,
    clearRanking,
    focusSuggestion,
    upNextSuggestions,
  };
}

// ── useApiKey ──

export function useApiKey() {
  const [apiKey, setApiKeyState] = useState<string | null>(() => SettingsService.getApiKey());
  const [provider, setProviderState] = useState<AIProvider>(() => SettingsService.getProvider());

  const saveApiKey = useCallback((key: string, prov: AIProvider) => {
    SettingsService.setApiKey(key);
    SettingsService.setProvider(prov);
    setApiKeyState(key);
    setProviderState(prov);
  }, []);

  const clearApiKey = useCallback(() => {
    SettingsService.clearApiKey();
    SettingsService.clearProvider();
    setApiKeyState(null);
    setProviderState('claude');
  }, []);

  const hasApiKey = apiKey !== null && apiKey.length > 0;

  return { apiKey, provider, hasApiKey, saveApiKey, clearApiKey };
}

// ── useClock ──

export function useClock() {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(interval);
  }, []);

  const timeString = useMemo(
    () =>
      now.toLocaleTimeString([], {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
      }),
    [now]
  );

  const dateString = useMemo(
    () =>
      now.toLocaleDateString([], {
        weekday: 'long',
        month: 'short',
        day: 'numeric',
      }),
    [now]
  );

  const timezone = useMemo(() => SettingsService.getTimezone(), []);

  return { now, timeString, dateString, timezone };
}
