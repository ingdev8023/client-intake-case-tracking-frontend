import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { getStoredToken } from "../api/client.js";
import { getCurrentUser, login as loginRequest, logout as logoutRequest } from "../api/authApi.js";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [isRestoringSession, setIsRestoringSession] = useState(true);

  const logout = useCallback(() => {
    logoutRequest();
    setCurrentUser(null);
  }, []);

  const login = useCallback(async (email, password) => {
    const user = await loginRequest(email, password);
    setCurrentUser(user);
    return user;
  }, []);

  useEffect(() => {
    let isMounted = true;

    async function restoreSession() {
      if (!getStoredToken()) {
        setIsRestoringSession(false);
        return;
      }

      try {
        const user = await getCurrentUser();
        if (isMounted) {
          setCurrentUser(user);
        }
      } catch {
        logoutRequest();
      } finally {
        if (isMounted) {
          setIsRestoringSession(false);
        }
      }
    }

    restoreSession();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    function handleExpiredAuth() {
      setCurrentUser(null);
    }

    window.addEventListener("auth:expired", handleExpiredAuth);
    return () => window.removeEventListener("auth:expired", handleExpiredAuth);
  }, []);

  const value = useMemo(
    () => ({
      currentUser,
      isAuthenticated: Boolean(currentUser),
      isAdmin: currentUser?.user_role === "admin",
      isRestoringSession,
      login,
      logout,
    }),
    [currentUser, isRestoringSession, login, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used inside AuthProvider");
  }

  return context;
}
