import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from 'react';
import { getToken, saveSession, clearSession } from '../services/session';

type SignInData = { token: string; name: string; email: string };

type AuthContextValue = {
  token: string | null;
  isLoading: boolean;
  signIn: (data: SignInData) => Promise<void>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Restore the session once on launch — drives the root auth routing.
  useEffect(() => {
    getToken()
      .then(setToken)
      .catch(() => setToken(null))
      .finally(() => setIsLoading(false));
  }, []);

  const signIn = async (data: SignInData) => {
    await saveSession(data);
    setToken(data.token);
  };

  const signOut = async () => {
    await clearSession();
    setToken(null);
  };

  return (
    <AuthContext.Provider value={{ token, isLoading, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return ctx;
}
