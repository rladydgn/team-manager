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
import type { CurrentUser } from "@/features/auth/model/auth-user";

export type { CurrentUser } from "@/features/auth/model/auth-user";

type AuthSession = {
  user: CurrentUser;
};

type AuthSessionContextValue = {
  currentUser: CurrentUser | null;
  isSessionReady: boolean;
  startSession: (session: AuthSession) => void;
  endSession: () => Promise<void>;
};

const AuthSessionContext = createContext<AuthSessionContextValue | null>(null);

export function AuthSessionProvider({
  children,
  initialUser,
}: {
  children: ReactNode;
  initialUser: CurrentUser | null;
}) {
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(initialUser);
  const [isSessionReady, setIsSessionReady] = useState(initialUser !== null);
  const sessionVersionRef = useRef(0);
  const startSession = useCallback((session: AuthSession) => {
    setCurrentUser(session.user);
  }, []);
  const endSession = useCallback(async () => {
    sessionVersionRef.current += 1;

    try {
      await signOut();
    } finally {
      setCurrentUser(null);
    }
  }, []);
  useEffect(() => {
    if (initialUser) {
      return;
    }

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
  }, [initialUser, startSession]);
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
