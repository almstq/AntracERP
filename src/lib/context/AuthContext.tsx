import type { ReactNode } from 'react';
import { useState, useEffect, useCallback } from 'react';
import type { User as FirebaseUser } from 'firebase/auth';
import { onAuthStateChanged, signInWithPopup, GoogleAuthProvider, signOut as firebaseSignOut } from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { getAuthInstance, getDbInstance } from '../firebase/client';
import { AuthContext } from './AuthContext.context';
import type { AuthUser } from './AuthContext.context';
import { MOCK_USERS } from '../mock-data/tickets';
import { hydrateFromFirestore } from '../permissions/roleRegistry';

export type { AuthUser };

// Find mock user by UID
function findMockUser(uid: string): AuthUser | null {
  const mock = MOCK_USERS.find(u => u.uid === uid);
  if (!mock) return null;
  return {
    uid: mock.uid,
    email: mock.email,
    displayName: mock.displayName,
    role: mock.role,
    orgId: mock.orgId,
    orgName: mock.orgId === 'antrac-holding' ? 'Antrac Holding' : mock.orgId === 'sbu-wli' ? 'WLI' : 'Antrac',
    siteIds: mock.siteIds ?? [],
  };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [devUser, setDevUser] = useState<string | null>(null);
  const [actingRole, setActingRole] = useState<string | null>(null);

  useEffect(() => {
    // If in dev mode, skip Firebase auth listener
    if (devUser) {
      const mu = findMockUser(devUser);
      if (mu) {
        setUser(mu);
        setLoading(false);
      }
      return;
    }

    const firebaseAuth = getAuthInstance();
    const firebaseDb = getDbInstance();
    if (!firebaseAuth || !firebaseDb) {
      setLoading(false);
      return;
    }
    const unsubscribe = onAuthStateChanged(firebaseAuth, async (fbUser: FirebaseUser | null) => {
      if (!fbUser) {
        setUser(null);
        setLoading(false);
        return;
      }
      // Re-enter loading while we fetch the user doc — prevents auth-gap flicker
      // if a user logs out then back in (loading was false after logout).
      setLoading(true);
      try {
        const userDoc = await getDoc(doc(firebaseDb, 'users', fbUser.uid));
        if (userDoc.exists()) {
          const data = userDoc.data() as { role: string; orgId: string; orgName?: string; siteIds?: string[] };
          if (data.role !== 'pending') {
            await hydrateFromFirestore();
          }
          setUser({
            uid: fbUser.uid,
            email: fbUser.email || '',
            displayName: fbUser.displayName || '',
            role: data.role,
            orgId: data.orgId,
            orgName: data.orgName || 'Antrac Holding',
            siteIds: data.siteIds ?? [],
          });
        } else {
          // First sign-in — persist a pending user doc so the Super Admin sees the
          // access request and can assign a role. Login still proceeds if rules block it.
          try {
            await setDoc(doc(firebaseDb, 'users', fbUser.uid), {
              email: fbUser.email || '', displayName: fbUser.displayName || '',
              role: 'pending', roleId: 'pending', status: 'pending', orgId: '', siteIds: [], createdAt: serverTimestamp(),
            }, { merge: true });
          } catch { /* security rules may block self-write; non-fatal */ }
          setUser({ uid: fbUser.uid, email: fbUser.email || '', displayName: fbUser.displayName || '', role: 'pending', orgId: '', orgName: '', siteIds: [] });
        }
      } catch {
        setUser({ uid: fbUser.uid, email: fbUser.email || '', displayName: fbUser.displayName || '', role: 'pending', orgId: '', orgName: '', siteIds: [] });
      }
      setLoading(false);
    });
    return unsubscribe;
  }, [devUser]);

  const login = useCallback(async (uidOrEmpty?: string) => {
    // Dev login: if uid provided, set dev mode
    if (uidOrEmpty) {
      setDevUser(uidOrEmpty);
      return;
    }
    // Production: Google popup
    const firebaseAuth = getAuthInstance();
    if (!firebaseAuth) return;
    await signInWithPopup(firebaseAuth, new GoogleAuthProvider());
  }, []);

  const logout = useCallback(async () => {
    setDevUser(null);
    setActingRole(null);
    const firebaseAuth = getAuthInstance();
    if (!firebaseAuth) return;
    try {
      await firebaseSignOut(firebaseAuth);
    } catch {
      // ignore
    }
    setUser(null);
  }, []);

  const effectiveRole = actingRole ?? user?.role ?? 'pending';
  const adminOverride = user?.role === 'super_admin' && effectiveRole !== 'super_admin';
  const actor = user
    ? {
        id: user.uid,
        role: effectiveRole,
        name: user.displayName || undefined,
        realRole: user.role,
        adminOverride,
      }
    : null;

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, effectiveRole, actingRole, setActingRole, isMock: !!devUser, actor }}>
      {children}
    </AuthContext.Provider>
  );
}
