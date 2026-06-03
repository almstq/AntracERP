import { createContext } from 'react';

export interface AuthUser {
  uid: string;
  email: string;
  displayName: string;
  role: string;
  orgId: string;
  orgName: string;
  /** Operational territory — site IDs this user covers. Empty = not site-bound (e.g. finance). */
  siteIds: string[];
}

export interface AuthContextType {
  user: AuthUser | null;
  loading: boolean;
  login: (uid?: string) => Promise<void>;
  logout: () => Promise<void>;
  /** Real role unless a super_admin is impersonating an actor for testing. */
  effectiveRole: string;
  /** When set (super_admin only), the workflow UI behaves as this role. */
  actingRole: string | null;
  setActingRole: (role: string | null) => void;
  /** True when signed in via Developer Login (mock) — no Firebase token, writes will be denied. */
  isMock: boolean;
}

export const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  login: async () => {},
  logout: async () => {},
  effectiveRole: 'pending',
  actingRole: null,
  setActingRole: () => {},
  isMock: false,
});
