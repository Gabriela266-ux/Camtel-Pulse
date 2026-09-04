import React, { useState } from 'react';
import { AuthContext } from './authState';
import type { User } from './authState';

export interface AuthProviderProps {
  children: React.ReactNode;
}

const readStoredUser = (): User | null => {
  const storedUser = localStorage.getItem('cp_user');
  if (!storedUser) return null;

  try {
    const parsed = JSON.parse(storedUser) as Partial<User>;
    return {
      ...parsed,
      partenaireIds: Array.isArray(parsed.partenaireIds)
        ? parsed.partenaireIds.map(String)
        : parsed.partenaireId ? [String(parsed.partenaireId)] : [],
    } as User;
  } catch {
    localStorage.removeItem('cp_user');
    localStorage.removeItem('cp_token');
    return null;
  }
};

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('cp_token'));
  const [user, setUser] = useState<User | null>(readStoredUser);

  const login = (newToken: string, newUser: User) => {
    setToken(newToken);
    setUser(newUser);
    localStorage.setItem('cp_token', newToken);
    localStorage.setItem('cp_user', JSON.stringify(newUser));
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('cp_token');
    localStorage.removeItem('cp_user');
  };

  return (
    <AuthContext.Provider value={{ user, token, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
