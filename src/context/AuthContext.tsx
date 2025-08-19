import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type AuthUser = { id: number; nome: string; email: string; role: string };

type AuthContextType = {
  user: AuthUser | null;
  isLogged: boolean;
  loading: boolean;
  login: (u: AuthUser) => Promise<void>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  const hydrate = useCallback(async () => {
    try {
      const [flag, raw] = await Promise.all([
        AsyncStorage.getItem('@logged'),
        AsyncStorage.getItem('@user'),
      ]);
      if (flag === 'true' && raw) setUser(JSON.parse(raw));
      else setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  const login = async (u: AuthUser) => {
    await AsyncStorage.setItem('@logged', 'true');
    await AsyncStorage.setItem('@user', JSON.stringify(u));
    setUser(u); // 🔔 todo mundo que usa contexto atualiza
  };

  const logout = async () => {
    await AsyncStorage.multiRemove(['@logged', '@user']);
    setUser(null); // 🔔 volta pro AuthRoutes automaticamente
  };

  return (
    <AuthContext.Provider value={{ user, isLogged: !!user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth deve ser usado dentro de <AuthProvider>');
  return ctx;
}
