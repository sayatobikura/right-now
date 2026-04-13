import { useReducer, useEffect, useRef, useState, useCallback, useMemo } from 'react';
import type { Note, NoteAction, AIProvider, AIOrganizeResult, AIConnectionResult } from '../types';
import * as NoteService from '../services/NoteService';
import * as FirestoreNoteService from '../services/FirestoreNoteService';
import * as AIService from '../services/AIService';
import * as SettingsService from '../services/SettingsService';

// ── useNotes ──

function noteReducer(state: Note[], action: NoteAction): Note[] {
  switch (action.type) {
    case 'ADD_NOTE':
      return [action.note, ...state];
    case 'UPDATE_NOTE':
      return state.map((n) =>
        n.id === action.id
          ? { ...n, ...action.updates, updatedAt: new Date().toISOString() }
          : n
      );
    case 'DELETE_NOTE':
      return state.filter((n) => n.id !== action.id);
    case 'TOGGLE_PIN':
      return state.map((n) =>
        n.id === action.id ? { ...n, isPinned: !n.isPinned } : n
      );
    case 'LOAD_NOTES':
      return action.notes;
    default:
      return state;
  }
}

export function useNotes(uid: string | null) {
  const [notes, dispatch] = useReducer(noteReducer, []);
  const isInitialized = useRef(false);
  const currentUid = useRef(uid);
  currentUid.current = uid;

  // Load notes from Firestore (if logged in) or localStorage
  useEffect(() => {
    isInitialized.current = false;
    (async () => {
      let loaded: Note[];
      if (uid) {
        try {
          loaded = await FirestoreNoteService.loadNotes(uid);
        } catch {
          loaded = NoteService.loadNotes();
        }
      } else {
        loaded = NoteService.loadNotes();
      }
      dispatch({ type: 'LOAD_NOTES', notes: loaded });
      isInitialized.current = true;
    })();
  }, [uid]);

  // Persist to localStorage always (as fallback)
  useEffect(() => {
    if (isInitialized.current) {
      NoteService.saveNotes(notes);
    }
  }, [notes]);

  const addNote = useCallback((content: string) => {
    const note = NoteService.createNote(content);
    dispatch({ type: 'ADD_NOTE', note });
    // Async sync to Firestore
    if (currentUid.current) {
      FirestoreNoteService.saveNote(currentUid.current, note).catch(() => {});
    }
    return note;
  }, []);

  const updateNote = useCallback((id: string, updates: Partial<Omit<Note, 'id' | 'createdAt'>>) => {
    dispatch({ type: 'UPDATE_NOTE', id, updates });
    if (currentUid.current) {
      FirestoreNoteService.updateNote(currentUid.current, id, {
        ...updates,
        updatedAt: new Date().toISOString(),
      }).catch(() => {});
    }
  }, []);

  const deleteNote = useCallback((id: string) => {
    dispatch({ type: 'DELETE_NOTE', id });
    if (currentUid.current) {
      FirestoreNoteService.deleteNote(currentUid.current, id).catch(() => {});
    }
  }, []);

  const togglePin = useCallback((id: string) => {
    dispatch({ type: 'TOGGLE_PIN', id });
    // We don't know the new value here, so sync the full note after state update
    // This is fine since Firestore write is async anyway
  }, []);

  const allTags = useMemo(() => NoteService.getAllTags(notes), [notes]);
  const allCategories = useMemo(() => NoteService.getAllCategories(notes), [notes]);

  const sortedNotes = useMemo(() => {
    return [...notes].sort((a, b) => {
      if (a.isPinned && !b.isPinned) return -1;
      if (!a.isPinned && b.isPinned) return 1;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
  }, [notes]);

  return {
    notes: sortedNotes,
    addNote,
    updateNote,
    deleteNote,
    togglePin,
    allTags,
    allCategories,
  };
}

// ── useAIOrganize ──

export function useAIOrganize() {
  const [isOrganizing, setIsOrganizing] = useState(false);
  const [organizeError, setOrganizeError] = useState<string | null>(null);
  const [connections, setConnections] = useState<AIConnectionResult[]>([]);
  const [isLoadingConnections, setIsLoadingConnections] = useState(false);
  const loadingRef = useRef(false);

  const organizeNote = useCallback(
    async (
      content: string,
      apiKey: string,
      provider: AIProvider
    ): Promise<AIOrganizeResult | null> => {
      if (loadingRef.current) return null;
      loadingRef.current = true;
      setIsOrganizing(true);
      setOrganizeError(null);
      const { result, error } = await AIService.organizeNote(content, apiKey, provider);
      if (error) setOrganizeError(error);
      setIsOrganizing(false);
      loadingRef.current = false;
      return result;
    },
    []
  );

  const clearError = useCallback(() => setOrganizeError(null), []);

  const findConnections = useCallback(
    async (note: Note, allNotes: Note[], apiKey: string, provider: AIProvider) => {
      setIsLoadingConnections(true);
      const result = await AIService.findConnections(note, allNotes, apiKey, provider);
      setConnections(result);
      setIsLoadingConnections(false);
    },
    []
  );

  const clearConnections = useCallback(() => setConnections([]), []);

  return {
    isOrganizing,
    organizeError,
    clearError,
    organizeNote,
    connections,
    isLoadingConnections,
    findConnections,
    clearConnections,
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
