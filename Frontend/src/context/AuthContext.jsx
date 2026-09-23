import React, {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";

import { apiRequest } from "../services/api";

const AuthContext = createContext(null);
const TOKEN_KEY = "homeServices.accessToken";

function readStoredToken() {
  try {
    return sessionStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

function storeToken(token) {
  try {
    if (token) {
      sessionStorage.setItem(TOKEN_KEY, token);
    } else {
      sessionStorage.removeItem(TOKEN_KEY);
    }
  } catch {
    // Authentication can still work in memory if storage is unavailable.
  }
}

export function AuthProvider({ children }) {
  const [token, setToken] = useState(readStoredToken);
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // Prevent an older login/register response from restoring a logged-out session.
  const authVersion = useRef(0);

  useEffect(() => {
    if (!token) {
      setUser(null);
      setIsLoading(false);
      return;
    }

    const controller = new AbortController();
    let active = true;

    async function restoreSession() {
      setIsLoading(true);

      try {
        const data = await apiRequest("/users/me", {
          token,
          signal: controller.signal,
        });

        if (active) {
          setUser(data.user);
        }
      } catch (error) {
        if (!active || error.name === "AbortError") {
          return;
        }

        storeToken(null);
        setToken(null);
        setUser(null);
      } finally {
        if (active) {
          setIsLoading(false);
        }
      }
    }

    restoreSession();

    return () => {
      active = false;
      controller.abort();
    };
  }, [token]);

  async function authenticate(path, credentials) {
    const version = ++authVersion.current;

    const data = await apiRequest(path, {
      method: "POST",
      body: credentials,
    });

    if (version !== authVersion.current) {
      return;
    }

    storeToken(data.accessToken);
    setUser(data.user);
    setIsLoading(true);
    setToken(data.accessToken);

    return data.user;
  }

  function login(credentials) {
    return authenticate("/auth/login", credentials);
  }

  function register(details) {
    return authenticate("/auth/register", details);
  }

  async function updateProfile(details) {
    const version = authVersion.current;

    try {
      const data = await apiRequest("/users/me", {
        method: "PATCH",
        token,
        body: details,
      });

      // Ignore responses from a session that has since changed.
      if (version !== authVersion.current) {
        return null;
      }

      setUser(data.user);

      return data.user;
    } catch (error) {
      const sessionIsInvalid =
        error.status === 401 ||
        error.code === "ACCOUNT_INACTIVE" ||
        error.code === "ACCOUNT_UNAVAILABLE";

      if (
        version === authVersion.current &&
        sessionIsInvalid
      ) {
        logout();
      }

      throw error;
    }
  }

  function logout() {
    authVersion.current += 1;
    storeToken(null);
    setToken(null);
    setUser(null);
    setIsLoading(false);
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        isAuthenticated: Boolean(user && token),
        login,
        register,
        logout,
        updateProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used inside AuthProvider");
  }

  return context;
}