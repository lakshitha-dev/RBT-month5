import { useState, type ReactNode } from 'react';
import { api, tokenStore, type User } from './api/client';
import { AuthContext, type AuthState } from './useAuth';

const USER_KEY = 'blogflow.user';

function loadUser(): User | null {
  try {
    return tokenStore.get() ? JSON.parse(localStorage.getItem(USER_KEY) || 'null') : null;
  } catch {
    return null;
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(loadUser);

  const save = ({ user, token }: { user: User; token: string }) => {
    tokenStore.set(token);
    localStorage.setItem(USER_KEY, JSON.stringify(user));
    setUser(user);
  };

  const value: AuthState = {
    user,
    login: async (email, password) => save(await api.login(email, password)),
    register: async (input) => save(await api.register(input)),
    logout: () => {
      tokenStore.clear();
      localStorage.removeItem(USER_KEY);
      setUser(null);
    },
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
