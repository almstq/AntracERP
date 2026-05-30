import { createContext } from 'react';

export interface AuthUser {
  uid: string;
  email: string;
  displayName: string;
  role: string;
  orgId: string;
  orgName: string;
}

export interface AuthContextType {
  user: AuthUser | null;
  loading: boolean;
  login: (uid?: string) => Promise<void>;
  logout: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  login: async (_uid?: string) => {},
  logout: async () => {},
});
