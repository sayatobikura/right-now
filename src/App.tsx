import { useState, useEffect, useRef, useCallback } from 'react';
import type { AppView } from './types';
import { useTasks, useAI, useApiKey, useClock } from './hooks/useApp';
import SetupScreen from './components/SetupScreen';
import Header from './components/Header';
import QuickAdd from './components/QuickAdd';
import FocusCard from './components/FocusCard';
import UpNext from './components/UpNext';
import ProgressBar from './components/ProgressBar';
import TaskList from './components/TaskList';
import EmptyState from './components/EmptyState';

export default function App() {
  const [currentView, setCurrentView] = useState<AppView>('dashboard');
  const { tasks, addTask, updateTask, deleteTask, completeTask, skipTask, reopenTask, openTasks, todayStats } = useTasks();
  const { isLoading, error, fetchRanking, focusSuggestion, upNextSuggestions } = useAI();
  const { apiKey, provider, hasApiKey, saveApiKey, clearApiKey } = useApiKey();
  const { timeString, dateString, timezone } = useClock();

  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined);
  const prevOpenCountRef = useRef<number>(0);
  const openTasksRef = useRef(openTasks);
  openTasksRef.current = openTasks;

  const triggerRanking = useCallback(() => {
    if (apiKey && openTasksRef.current.length > 0) {
      fetchRanking(openTasksRef.current, apiKey, provider);
    }
  }, [apiKey, provider, fetchRanking]);

  // Auto-rank when open tasks change (debounced)
  useEffect(() => {
    if (!hasApiKey || openTasks.length === 0) return;

    // On first load with tasks, rank immediately
    if (prevOpenCountRef.current === 0 && openTasks.length > 0) {
      prevOpenCountRef.current = openTasks.length;
      triggerRanking();
      return;
    }

    prevOpenCountRef.current = openTasks.length;

    // Debounce subsequent changes
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(triggerRanking, 2000);

    return () => clearTimeout(debounceRef.current);
  }, [hasApiKey, openTasks.length, triggerRanking]);

  // Show setup if no API key
  if (!hasApiKey) {
    return <SetupScreen onSave={saveApiKey} />;
  }

  const focusTask = focusSuggestion
    ? tasks.find((t) => t.id === focusSuggestion.taskId) ?? null
    : null;

  return (
    <div className="min-h-screen bg-surface-0">
      <Header
        currentView={currentView}
        onViewChange={setCurrentView}
        timeString={timeString}
        dateString={dateString}
        timezone={timezone}
        provider={provider}
        onClearApiKey={clearApiKey}
      />

      <main className="max-w-2xl mx-auto px-4 py-6 space-y-6">
        {currentView === 'dashboard' ? (
          <>
            <QuickAdd onAdd={addTask} />
            <ProgressBar total={todayStats.total} completed={todayStats.completed} />

            {error && (
              <div className="bg-danger/10 border border-danger/20 rounded-lg px-4 py-3">
                <p className="text-sm text-danger">{error}</p>
              </div>
            )}

            {openTasks.length === 0 && !isLoading ? (
              <EmptyState />
            ) : (
              <>
                <FocusCard
                  suggestion={focusSuggestion}
                  task={focusTask}
                  onComplete={completeTask}
                  onSkip={skipTask}
                  onRefresh={triggerRanking}
                  isLoading={isLoading}
                />
                <UpNext suggestions={upNextSuggestions} tasks={tasks} />
              </>
            )}
          </>
        ) : (
          <>
            <QuickAdd onAdd={addTask} />
            <TaskList
              tasks={tasks}
              onUpdate={updateTask}
              onDelete={deleteTask}
              onComplete={completeTask}
              onSkip={skipTask}
              onReopen={reopenTask}
            />
          </>
        )}
      </main>
    </div>
  );
}
