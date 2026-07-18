"use client";

import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { refreshSession, signOut } from "@/features/auth/api/auth";
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
  isSessionReady: boolean;
  startSession: (session: AuthSession) => void;
  endSession: () => Promise<void>;
};

const AuthSessionContext = createContext<AuthSessionContextValue | null>(null);

export function AuthSessionProvider({ children }: { children: ReactNode }) {
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);
  const [isSessionReady, setIsSessionReady] = useState(false);
  const sessionVersionRef = useRef(0);
  const startSession = useCallback((session: AuthSession) => {
    setAccessToken(session.accessToken);
    setCurrentUser(session.user);
  }, []);
  const endSession = useCallback(async () => {
    sessionVersionRef.current += 1;

    try {
      await signOut();
    } finally {
      setAccessToken(null);
      setCurrentUser(null);
    }
  }, []);
  useEffect(() => {
    let isMounted = true;
    const sessionVersion = sessionVersionRef.current;

    async function restoreSession() {
      try {
        const response = await refreshSession();

        if (
          isMounted &&
          sessionVersion === sessionVersionRef.current &&
          response.data
        ) {
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
      } finally {
        if (isMounted) {
          setIsSessionReady(true);
        }
      }
    }

    void restoreSession();

    return () => {
      isMounted = false;
    };
  }, [startSession]);
  const value = useMemo(
    () => ({ currentUser, isSessionReady, startSession, endSession }),
    [currentUser, endSession, isSessionReady, startSession]
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
