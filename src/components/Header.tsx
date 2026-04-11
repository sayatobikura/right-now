import { useState } from 'react';
import type { AppView } from '../types';

interface HeaderProps {
  currentView: AppView;
  onViewChange: (view: AppView) => void;
  timeString: string;
  dateString: string;
  timezone: string;
  onClearApiKey: () => void;
}

export default function Header({
  currentView,
  onViewChange,
  timeString,
  dateString,
  timezone,
  onClearApiKey,
}: HeaderProps) {
  const [showSettings, setShowSettings] = useState(false);

  return (
    <header className="sticky top-0 z-10 bg-surface-1 border-b border-border">
      <div className="max-w-2xl mx-auto px-4 py-3 flex items-center justify-between">
        {/* Left: App name */}
        <button
          onClick={() => onViewChange('dashboard')}
          className="text-lg font-bold text-text-primary hover:text-accent transition-colors"
        >
          ⚡ Right Now
        </button>

        {/* Center: Clock */}
        <div className="hidden sm:flex flex-col items-center">
          <span className="text-sm font-medium text-text-primary">{timeString}</span>
          <span className="text-xs text-text-tertiary">
            {dateString} · {timezone}
          </span>
        </div>

        {/* Right: Nav + Settings */}
        <div className="flex items-center gap-2">
          <nav className="flex bg-surface-2 rounded-lg p-0.5">
            <button
              onClick={() => onViewChange('dashboard')}
              className={`px-3 py-1 text-sm rounded-md transition-colors ${
                currentView === 'dashboard'
                  ? 'bg-accent text-white'
                  : 'text-text-secondary hover:text-text-primary'
              }`}
            >
              Focus
            </button>
            <button
              onClick={() => onViewChange('tasks')}
              className={`px-3 py-1 text-sm rounded-md transition-colors ${
                currentView === 'tasks'
                  ? 'bg-accent text-white'
                  : 'text-text-secondary hover:text-text-primary'
              }`}
            >
              Tasks
            </button>
          </nav>

          <div className="relative">
            <button
              onClick={() => setShowSettings(!showSettings)}
              className="p-2 text-text-tertiary hover:text-text-primary transition-colors"
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
                <circle cx="8" cy="8" r="2.5" />
                <path d="M8 1v2M8 13v2M1 8h2M13 8h2M2.93 2.93l1.41 1.41M11.66 11.66l1.41 1.41M2.93 13.07l1.41-1.41M11.66 4.34l1.41-1.41" />
              </svg>
            </button>

            {showSettings && (
              <>
                <div
                  className="fixed inset-0"
                  onClick={() => setShowSettings(false)}
                />
                <div className="absolute right-0 top-full mt-1 bg-surface-2 border border-border rounded-lg shadow-lg py-1 min-w-[160px]">
                  <button
                    onClick={() => {
                      onClearApiKey();
                      setShowSettings(false);
                    }}
                    className="w-full text-left px-4 py-2 text-sm text-text-secondary hover:text-text-primary hover:bg-surface-1 transition-colors"
                  >
                    Change API Key
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
