import { useContext } from 'react';
import { AuthContext } from '../context/AuthContext.context';
import type { AuthUser } from '../context/AuthContext.context';

interface AuthContextValue {
  user: AuthUser | null;
  loading: boolean;
  login: (uid?: string) => Promise<void>;
  logout: () => Promise<void>;
}

export function useAuthContext(): AuthContextValue {
  return useContext(AuthContext) as AuthContextValue;
}

export const useAuth = useAuthContext;
