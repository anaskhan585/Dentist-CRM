import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { api, get, post, tokenStore } from './api.js';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [status, setStatus] = useState('loading'); // loading | authenticated | guest

  useEffect(() => {
    let cancelled = false;

    async function restore() {
      if (!tokenStore.get()) {
        setStatus('guest');
        return;
      }
      try {
        const me = await get('/auth/me');
        if (!cancelled) {
          setUser(me);
          setStatus('authenticated');
        }
      } catch {
        tokenStore.clear();
        if (!cancelled) setStatus('guest');
      }
    }

    restore();
    return () => {
      cancelled = true;
    };
  }, []);

  const login = useCallback(async (credentials) => {
    const result = await post('/auth/login', credentials);
    tokenStore.set(result.token);
    setUser(result.user);
    setStatus('authenticated');
    return result.user;
  }, []);

  const logout = useCallback(async () => {
    try {
      await api.post('/auth/logout');
    } catch {
      // A failed logout call shouldn't trap the user in the app.
    }
    tokenStore.clear();
    setUser(null);
    setStatus('guest');
  }, []);

  const value = useMemo(
    () => ({
      user,
      status,
      login,
      logout,
      setUser,
      isAdmin: user?.role === 'admin',
      canChart: ['admin', 'dentist', 'hygienist'].includes(user?.role),
    }),
    [user, status, login, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used inside <AuthProvider>');
  return context;
}
