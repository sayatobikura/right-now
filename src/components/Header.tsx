import { useState } from 'react';
import type { AppView, AIProvider } from '../types';

interface HeaderProps {
  currentView: AppView;
  onViewChange: (view: AppView) => void;
  timeString: string;
  dateString: string;
  timezone: string;
  provider: AIProvider;
  onClearApiKey: () => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
}

export default function Header({
  currentView,
  onViewChange,
  timeString,
  dateString,
  timezone,
  provider,
  onClearApiKey,
  searchQuery,
  onSearchChange,
}: HeaderProps) {
  const [showSettings, setShowSettings] = useState(false);

  return (
    <header className="sticky top-0 z-10 bg-surface-1 border-b border-border">
      <div className="max-w-3xl mx-auto px-4 py-3 flex items-center justify-between gap-3">
        {/* Left: App name */}
        <button
          onClick={() => onViewChange('notes')}
          className="text-lg font-bold text-text-primary hover:text-accent transition-colors shrink-0"
        >
          ⚡ Right Now
        </button>

        {/* Center: Search */}
        <div className="flex-1 max-w-sm hidden sm:block">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search notes..."
            className="w-full bg-surface-2 border border-border rounded-lg px-3 py-1.5 text-sm text-text-primary placeholder:text-text-tertiary focus:outline-none focus:border-accent"
          />
        </div>

        {/* Right: Nav + Clock + Settings */}
        <div className="flex items-center gap-2">
          <div className="hidden md:flex flex-col items-end">
            <span className="text-xs font-medium text-text-primary">{timeString}</span>
            <span className="text-[10px] text-text-tertiary">
              {dateString} · {timezone}
            </span>
          </div>

          <nav className="flex bg-surface-2 rounded-lg p-0.5">
            <button
              onClick={() => onViewChange('notes')}
              className={`px-3 py-1 text-sm rounded-md transition-colors ${
                currentView === 'notes'
                  ? 'bg-accent text-white'
                  : 'text-text-secondary hover:text-text-primary'
              }`}
            >
              Notes
            </button>
            <button
              onClick={() => onViewChange('journal')}
              className={`px-3 py-1 text-sm rounded-md transition-colors ${
                currentView === 'journal'
                  ? 'bg-accent text-white'
                  : 'text-text-secondary hover:text-text-primary'
              }`}
            >
              Journal
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
                <div className="fixed inset-0" onClick={() => setShowSettings(false)} />
                <div className="absolute right-0 top-full mt-1 bg-surface-2 border border-border rounded-lg shadow-lg py-1 min-w-[180px]">
                  <div className="px-4 py-1.5 text-xs text-text-tertiary border-b border-border">
                    AI: {provider === 'claude' ? 'Claude' : 'ChatGPT'}
                  </div>
                  <button
                    onClick={() => {
                      onClearApiKey();
                      setShowSettings(false);
                    }}
                    className="w-full text-left px-4 py-2 text-sm text-text-secondary hover:text-text-primary hover:bg-surface-1 transition-colors"
                  >
                    Change Provider / Key
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Mobile search */}
      <div className="sm:hidden px-4 pb-3">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Search notes..."
          className="w-full bg-surface-2 border border-border rounded-lg px-3 py-1.5 text-sm text-text-primary placeholder:text-text-tertiary focus:outline-none focus:border-accent"
        />
      </div>
    </header>
  );
}
