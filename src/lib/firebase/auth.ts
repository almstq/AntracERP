import { getAuthInstance } from './client';
import type { AuthUser } from '../context/AuthContext.context';
import type { User } from 'firebase/auth';
import {
  GoogleAuthProvider,
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut,
} from 'firebase/auth';

function mapFirebaseUser(user: User): AuthUser {
  return {
    uid: user.uid,
    email: user.email || '',
    displayName: user.displayName || '',
    role: 'pending',
    orgId: '',
    orgName: '',
  };
}

export async function loginWithGoogle(): Promise<AuthUser | null> {
  const auth = getAuthInstance();
  if (!auth) return null;

  const provider = new GoogleAuthProvider();
  const result = await signInWithPopup(auth, provider);
  return mapFirebaseUser(result.user);
}

export async function loginWithEmail(email: string, password: string): Promise<AuthUser | null> {
  const auth = getAuthInstance();
  if (!auth) return null;

  const result = await signInWithEmailAndPassword(auth, email, password);
  return mapFirebaseUser(result.user);
}

export async function registerWithEmail(email: string, password: string): Promise<AuthUser | null> {
  const auth = getAuthInstance();
  if (!auth) return null;

  const result = await createUserWithEmailAndPassword(auth, email, password);
  return mapFirebaseUser(result.user);
}

export async function logout(): Promise<void> {
  const auth = getAuthInstance();
  if (!auth) return;

  await firebaseSignOut(auth);
}

export function getCurrentUser(): AuthUser | null {
  const auth = getAuthInstance();
  if (!auth || !auth.currentUser) return null;
  return mapFirebaseUser(auth.currentUser);
}
