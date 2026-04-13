import {
  collection,
  doc,
  getDocs,
  setDoc,
  deleteDoc,
  query,
  orderBy,
} from 'firebase/firestore';
import { db } from './firebase';
import type { Note } from '../types';

function notesCollection(uid: string) {
  return collection(db, 'users', uid, 'notes');
}

export async function loadNotes(uid: string): Promise<Note[]> {
  const q = query(notesCollection(uid), orderBy('createdAt', 'desc'));
  const snapshot = await getDocs(q);
  return snapshot.docs.map((d) => d.data() as Note);
}

export async function saveNote(uid: string, note: Note): Promise<void> {
  await setDoc(doc(db, 'users', uid, 'notes', note.id), note);
}

export async function updateNote(
  uid: string,
  noteId: string,
  updates: Partial<Note>
): Promise<void> {
  await setDoc(doc(db, 'users', uid, 'notes', noteId), updates, { merge: true });
}

export async function deleteNote(uid: string, noteId: string): Promise<void> {
  await deleteDoc(doc(db, 'users', uid, 'notes', noteId));
}
