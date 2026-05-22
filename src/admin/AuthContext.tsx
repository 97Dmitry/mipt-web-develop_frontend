import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';

import { ApiError } from '../api/client';
import * as adminAuthApi from '../api/adminAuth';
import type { AdminUser } from '../types/domain';
import { clearAdminToken, getAdminToken, setAdminToken } from '../utils/storage';
import { AdminAuthContext, type AdminAuthContextValue } from './adminAuthContext';

export function AdminAuthProvider({ children }: { children: ReactNode }) {
  const [token, setTokenState] = useState<string | null>(() => getAdminToken());
  const [user, setUser] = useState<AdminUser | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    let cancelled = false;

    async function bootstrap() {
      if (!token) {
        if (!cancelled) {
          setUser(null);
          setIsLoading(false);
        }
        return;
      }

      try {
        const me = await adminAuthApi.me(token);
        if (!cancelled) {
          setUser(me);
        }
      } catch {
        clearAdminToken();
        if (!cancelled) {
          setTokenState(null);
          setUser(null);
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    void bootstrap();
    return () => {
      cancelled = true;
    };
  }, [token]);

  const login = useCallback(async (loginValue: string, password: string): Promise<void> => {
    const response = await adminAuthApi.login({ login: loginValue, password });
    setAdminToken(response.accessToken);
    setTokenState(response.accessToken);
    setUser(response.user);
  }, []);

  const logout = useCallback(async (): Promise<void> => {
    const currentToken = token;
    clearAdminToken();
    setTokenState(null);
    setUser(null);
    if (!currentToken) return;
    try {
      await adminAuthApi.logout(currentToken);
    } catch (error) {
      if (!(error instanceof ApiError)) {
        throw error;
      }
    }
  }, [token]);

  const value = useMemo<AdminAuthContextValue>(
    () => ({
      token,
      user,
      isLoading,
      isAuthenticated: Boolean(token && user),
      login,
      logout,
    }),
    [isLoading, login, logout, token, user],
  );

  return <AdminAuthContext.Provider value={value}>{children}</AdminAuthContext.Provider>;
}
