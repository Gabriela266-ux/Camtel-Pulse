import React, { createContext, useContext, useState } from 'react';

export interface User {
  id: number;
  nom_complet: string;
  email: string;
  role: 'ADMIN' | 'MANAGER' | 'CHEF_OPE' | 'OPERATIONNEL';
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (token: string, user: User) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [token, setToken] = useState<string | null>(localStorage.getItem('cp_token'));
  const [user, setUser] = useState<User | null>(
    localStorage.getItem('cp_user') ? JSON.parse(localStorage.getItem('cp_user')!) : null
  );

  const login = (newToken: string, newUser: User) => {
    setToken(newToken);
    setUser(newUser);
    localStorage.setItem('cp_token', newToken);
    localStorage.setItem('cp_user', JSON.stringify(newUser));
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.clear();
  };

  return (
    <AuthContext.Provider value={{ user, token, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth doit être utilisé dans AuthProvider');
  return ctx;
};