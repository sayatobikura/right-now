import { useState, useEffect, useCallback } from 'react';
import {
  signInWithPopup,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  type User,
} from 'firebase/auth';
import { auth, googleProvider } from '../services/firebase';

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Firebase may not be configured — detect by checking if apiKey is set
  const isFirebaseConfigured = auth.app.options.apiKey !== '' && auth.app.options.apiKey != null;

  useEffect(() => {
    if (!isFirebaseConfigured) {
      setIsLoading(false);
      return;
    }
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setIsLoading(false);
    });
    return unsubscribe;
  }, [isFirebaseConfigured]);

  const signInWithGoogle = useCallback(async () => {
    if (!isFirebaseConfigured) {
      setError('Firebase not configured. Using local-only mode.');
      return;
    }
    try {
      setError(null);
      await signInWithPopup(auth, googleProvider);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Sign in failed';
      setError(message);
    }
  }, [isFirebaseConfigured]);

  const signOut = useCallback(async () => {
    try {
      await firebaseSignOut(auth);
    } catch {
      // ignore
    }
  }, []);

  return {
    user,
    isLoading,
    error,
    isFirebaseConfigured,
    signInWithGoogle,
    signOut,
  };
}
