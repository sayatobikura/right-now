import { useState, useCallback } from 'react';
import type { AppView, Note } from './types';
import { useNotes, useAIOrganize, useApiKey, useClock } from './hooks/useApp';
import { useAuth } from './hooks/useAuth';
import * as NoteService from './services/NoteService';
import SetupScreen from './components/SetupScreen';
import Header from './components/Header';
import NoteEditor from './components/NoteEditor';
import NoteGrid from './components/NoteGrid';
import NoteDetail from './components/NoteDetail';
import TagFilter from './components/TagFilter';
import TodayView from './components/TodayView';
import InboxView from './components/InboxView';
import CalendarView from './components/CalendarView';
import EmptyState from './components/EmptyState';

export default function App() {
  const [currentView, setCurrentView] = useState<AppView>('today');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedNote, setSelectedNote] = useState<Note | null>(null);

  const { user, isLoading: authLoading, error: authError, isFirebaseConfigured, signInWithGoogle, signOut } = useAuth();
  const uid = user?.uid ?? null;

  const {
    notes, addNote, updateNote, deleteNote, togglePin,
    completeItem, setStatus, scheduleItem,
    allTags, allCategories, todayItems, inboxItems, overdueCount,
  } = useNotes(uid);
  const { isOrganizing, organizeError, clearError, organizeNote, connections, isLoadingConnections, findConnections, clearConnections } = useAIOrganize();
  const { apiKey, provider, hasApiKey, saveApiKey, clearApiKey } = useApiKey();
  const { timeString, dateString, timezone } = useClock();

  // Add note + AI classify
  const handleAddNote = useCallback(
    async (content: string) => {
      const note = addNote(content);
      if (apiKey) {
        const result = await organizeNote(content, apiKey, provider);
        if (result) {
          const updates: Partial<Note> = {
            tags: result.tags,
            category: result.category,
          };
          if (result.type) updates.itemType = result.type;
          if (result.priority) updates.priority = result.priority;
          if (result.deadline) updates.deadline = result.deadline;
          if (result.suggestedSchedule) updates.scheduledDate = result.suggestedSchedule;
          // If AI detected a task or deadline, auto-activate
          if (result.type === 'task' || result.deadline) {
            updates.status = 'active';
          }
          updateNote(note.id, updates);
        }
      }
    },
    [addNote, apiKey, provider, organizeNote, updateNote]
  );

  const handleSelectNote = useCallback(
    (note: Note) => {
      setSelectedNote(note);
      clearConnections();
    },
    [clearConnections]
  );

  const handleFindConnections = useCallback(
    (note: Note) => {
      if (apiKey) findConnections(note, notes, apiKey, provider);
    },
    [apiKey, provider, notes, findConnections]
  );

  // Filter notes for grid view
  let filteredNotes = notes.filter((n) => (n.status ?? 'active') !== 'archived');
  if (searchQuery) filteredNotes = NoteService.searchNotes(filteredNotes, searchQuery);
  if (selectedTag) filteredNotes = filteredNotes.filter((n) => n.tags.includes(selectedTag));
  if (selectedCategory) filteredNotes = filteredNotes.filter((n) => n.category === selectedCategory);

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface-0">
        <div className="w-6 h-6 border-2 border-accent border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!hasApiKey) {
    return (
      <SetupScreen
        onSave={saveApiKey}
        onGoogleSignIn={signInWithGoogle}
        isFirebaseConfigured={isFirebaseConfigured}
        authError={authError}
      />
    );
  }

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
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        userName={user?.displayName}
        userPhoto={user?.photoURL}
        onSignOut={signOut}
        inboxCount={inboxItems.length}
        overdueCount={overdueCount}
      />

      <main className="max-w-3xl mx-auto px-4 py-6 space-y-6">
        <NoteEditor onAdd={handleAddNote} />

        {isOrganizing && (
          <div className="flex items-center gap-2 text-xs text-accent">
            <div className="w-3 h-3 border-2 border-accent border-t-transparent rounded-full animate-spin" />
            AI is classifying your capture...
          </div>
        )}

        {organizeError && (
          <div className="flex items-center justify-between bg-danger/10 border border-danger/20 rounded-lg px-4 py-2.5">
            <p className="text-xs text-danger">{organizeError}</p>
            <button onClick={clearError} className="text-xs text-danger/60 hover:text-danger ml-3">dismiss</button>
          </div>
        )}

        {currentView === 'today' && (
          <TodayView
            todayItems={todayItems}
            onComplete={completeItem}
            onSelect={handleSelectNote}
            overdueCount={overdueCount}
            dateString={dateString}
          />
        )}

        {currentView === 'inbox' && (
          <InboxView
            items={inboxItems}
            onSetStatus={setStatus}
            onSchedule={scheduleItem}
            onComplete={completeItem}
            onSelect={handleSelectNote}
          />
        )}

        {currentView === 'notes' && (
          <>
            <TagFilter
              tags={allTags}
              categories={allCategories}
              selectedTag={selectedTag}
              selectedCategory={selectedCategory}
              onTagSelect={setSelectedTag}
              onCategorySelect={setSelectedCategory}
            />
            {filteredNotes.length === 0 && !searchQuery && !selectedTag && !selectedCategory ? (
              <EmptyState />
            ) : filteredNotes.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-text-tertiary text-sm">No matching notes</p>
              </div>
            ) : (
              <NoteGrid
                notes={filteredNotes}
                onUpdate={updateNote}
                onDelete={deleteNote}
                onTogglePin={togglePin}
                onSelect={handleSelectNote}
                onComplete={completeItem}
              />
            )}
          </>
        )}

        {currentView === 'calendar' && (
          <CalendarView notes={notes} onSelect={handleSelectNote} />
        )}
      </main>

      {selectedNote && (
        <NoteDetail
          note={selectedNote}
          connections={connections}
          isLoadingConnections={isLoadingConnections}
          allNotes={notes}
          onUpdate={(id, updates) => {
            updateNote(id, updates);
            setSelectedNote((prev) => (prev ? { ...prev, ...updates } : null));
          }}
          onFindConnections={handleFindConnections}
          onClose={() => {
            setSelectedNote(null);
            clearConnections();
          }}
        />
      )}
    </div>
  );
}
