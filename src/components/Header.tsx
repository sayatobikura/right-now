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
  userName?: string | null;
  userPhoto?: string | null;
  onSignOut?: () => void;
  inboxCount: number;
  overdueCount: number;
}

const TABS: { view: AppView; label: string }[] = [
  { view: 'today', label: 'Today' },
  { view: 'inbox', label: 'Inbox' },
  { view: 'notes', label: 'Notes' },
  { view: 'calendar', label: 'Calendar' },
];

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
  userName,
  userPhoto,
  onSignOut,
  inboxCount,
  overdueCount,
}: HeaderProps) {
  const [showSettings, setShowSettings] = useState(false);

  return (
    <header className="sticky top-0 z-10 bg-surface-1 border-b border-border">
      <div className="max-w-3xl mx-auto px-4 py-3 flex items-center justify-between gap-3">
        {/* Left: App name */}
        <button
          onClick={() => onViewChange('today')}
          className="text-lg font-bold text-text-primary hover:text-accent transition-colors shrink-0"
        >
          ⚡ Right Now
        </button>

        {/* Center: Search (notes view only) */}
        {currentView === 'notes' && (
          <div className="flex-1 max-w-sm hidden sm:block">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Search notes..."
              className="w-full bg-surface-2 border border-border rounded-lg px-3 py-1.5 text-sm text-text-primary placeholder:text-text-tertiary focus:outline-none focus:border-accent"
            />
          </div>
        )}

        {/* Right: Clock + Settings */}
        <div className="flex items-center gap-2">
          <div className="hidden md:flex flex-col items-end">
            <span className="text-xs font-medium text-text-primary">{timeString}</span>
            <span className="text-[10px] text-text-tertiary">{dateString} · {timezone}</span>
          </div>

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
                <div className="absolute right-0 top-full mt-1 bg-surface-1 border border-border rounded-lg shadow-lg py-1 min-w-[180px]">
                  {userName && (
                    <div className="flex items-center gap-2 px-4 py-2 border-b border-border">
                      {userPhoto ? (
                        <img src={userPhoto} alt="" className="w-5 h-5 rounded-full" referrerPolicy="no-referrer" />
                      ) : (
                        <div className="w-5 h-5 rounded-full bg-accent flex items-center justify-center text-[10px] text-white font-bold">
                          {userName.charAt(0)}
                        </div>
                      )}
                      <span className="text-xs text-text-primary truncate">{userName}</span>
                    </div>
                  )}
                  <div className="px-4 py-1.5 text-xs text-text-tertiary border-b border-border">
                    AI: {provider === 'claude' ? 'Claude' : 'ChatGPT'}
                  </div>
                  <button
                    onClick={() => { onClearApiKey(); setShowSettings(false); }}
                    className="w-full text-left px-4 py-2 text-sm text-text-secondary hover:text-text-primary hover:bg-surface-2 transition-colors"
                  >
                    Change Provider / Key
                  </button>
                  {onSignOut && userName && (
                    <button
                      onClick={() => { onSignOut(); setShowSettings(false); }}
                      className="w-full text-left px-4 py-2 text-sm text-text-secondary hover:text-text-primary hover:bg-surface-2 transition-colors border-t border-border"
                    >
                      Sign Out
                    </button>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Nav tabs */}
      <div className="max-w-3xl mx-auto px-4 pb-2">
        <nav className="flex gap-1 bg-surface-2 rounded-lg p-0.5">
          {TABS.map((tab) => (
            <button
              key={tab.view}
              onClick={() => onViewChange(tab.view)}
              className={`flex-1 px-2 py-1.5 text-xs font-medium rounded-md transition-colors relative ${
                currentView === tab.view
                  ? 'bg-accent text-white'
                  : 'text-text-secondary hover:text-text-primary'
              }`}
            >
              {tab.label}
              {tab.view === 'inbox' && inboxCount > 0 && (
                <span className={`ml-1 text-[9px] px-1 rounded-full ${
                  currentView === 'inbox' ? 'bg-white/20' : 'bg-accent/20 text-accent'
                }`}>
                  {inboxCount}
                </span>
              )}
              {tab.view === 'today' && overdueCount > 0 && (
                <span className={`ml-1 text-[9px] px-1 rounded-full ${
                  currentView === 'today' ? 'bg-white/20' : 'bg-danger/20 text-danger'
                }`}>
                  {overdueCount}
                </span>
              )}
            </button>
          ))}
        </nav>
      </div>

      {/* Mobile search */}
      {currentView === 'notes' && (
        <div className="sm:hidden max-w-3xl mx-auto px-4 pb-2">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search notes..."
            className="w-full bg-surface-2 border border-border rounded-lg px-3 py-1.5 text-sm text-text-primary placeholder:text-text-tertiary focus:outline-none focus:border-accent"
          />
        </div>
      )}
    </header>
  );
}
