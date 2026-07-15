"use client";

import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { refreshSession } from "@/features/auth/api/auth";
import { setAccessToken } from "@/shared/auth/access-token";

export type CurrentUser = {
  id: number;
  name: string;
  username: string;
  email: string | null;
};

type AuthSession = {
  user: CurrentUser;
  accessToken: string;
};

type AuthSessionContextValue = {
  currentUser: CurrentUser | null;
  startSession: (session: AuthSession) => void;
};

const AuthSessionContext = createContext<AuthSessionContextValue | null>(null);

export function AuthSessionProvider({ children }: { children: ReactNode }) {
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);
  const startSession = useCallback((session: AuthSession) => {
    setAccessToken(session.accessToken);
    setCurrentUser(session.user);
  }, []);
  useEffect(() => {
    let isMounted = true;

    async function restoreSession() {
      try {
        const response = await refreshSession();

        if (isMounted && response.data) {
          startSession({
            user: {
              id: response.data.id,
              name: response.data.name,
              username: response.data.username,
              email: response.data.email,
            },
            accessToken: response.data.accessToken,
          });
        }
      } catch {
        // A refresh token is optional for anonymous visitors.
      }
    }

    void restoreSession();

    return () => {
      isMounted = false;
    };
  }, [startSession]);
  const value = useMemo(
    () => ({ currentUser, startSession }),
    [currentUser, startSession]
  );

  return (
    <AuthSessionContext.Provider value={value}>
      {children}
    </AuthSessionContext.Provider>
  );
}

export function useCurrentUser() {
  return useAuthSession().currentUser;
}

export function useAuthSession() {
  const context = useContext(AuthSessionContext);

  if (!context) {
    throw new Error("AuthSessionProvider is required.");
  }

  return context;
}
