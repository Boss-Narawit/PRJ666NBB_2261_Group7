import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from 'react';
import { getToken, saveSession, clearSession } from '../services/session';
import { setOnUnauthorized } from '../services/api';

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

  // A 401 on any authenticated request means the stored token is expired or
  // invalid — sign out so RootNavigator swaps back to the Login stack instead
  // of every screen erroring forever.
  useEffect(() => {
    setOnUnauthorized(() => {
      clearSession().finally(() => setToken(null));
    });
    return () => setOnUnauthorized(null);
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
