import { createContext } from 'react';

import type { AdminUser } from '../types/domain';

export interface AdminAuthContextValue {
  token: string | null;
  user: AdminUser | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (login: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

export const AdminAuthContext = createContext<AdminAuthContextValue | undefined>(undefined);
