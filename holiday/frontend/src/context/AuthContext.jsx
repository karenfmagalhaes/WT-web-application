import { createContext, useCallback, useEffect, useMemo, useState } from "react";
import { getSession, loginUser, logoutUser, registerUser } from "../api/authApi";
import { DEV_AUTH_BYPASS } from "../utils/env";

export const AuthContext = createContext(null);
const DEMO_USER = {
  _id: "demo-user",
  id: "demo-user",
  name: "Demo User",
  email: "demo@local.dev",
};

const normalizeUser = (raw) => {
  if (!raw) return null;
  const name =
    [raw.firstName, raw.lastName].filter(Boolean).join(" ") ||
    raw.name ||
    raw.email ||
    "User";
  return { ...raw, name };
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (DEV_AUTH_BYPASS) {
      setUser(DEMO_USER);
      setLoading(false);
      return;
    }

    (async () => {
      try {
        setError("");
        const { data } = await getSession();
        setUser(data.loggedIn ? normalizeUser(data.user) : null);
      } catch {
        setUser(null);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const login = useCallback(async (credentials) => {
    setLoading(true);
    setError("");

    try {
      if (DEV_AUTH_BYPASS) {
        setUser(DEMO_USER);
        return DEMO_USER;
      }

      const { data } = await loginUser(credentials);
      const normalized = normalizeUser(data.user);
      setUser(normalized);
      return normalized;
    } catch (loginError) {
      setError(loginError.response?.data?.message ?? loginError.message);
      throw loginError;
    } finally {
      setLoading(false);
    }
  }, []);

  const signup = useCallback(async (credentials) => {
    setLoading(true);
    setError("");

    try {
      if (DEV_AUTH_BYPASS) {
        setUser(DEMO_USER);
        return DEMO_USER;
      }

      const { data } = await registerUser(credentials);
      const normalized = normalizeUser(data.user);
      setUser(normalized);
      return normalized;
    } catch (signupError) {
      setError(signupError.response?.data?.message ?? signupError.message);
      throw signupError;
    } finally {
      setLoading(false);
    }
  }, []);

  const logout = useCallback(async () => {
    setLoading(true);

    try {
      if (!DEV_AUTH_BYPASS) {
        await logoutUser();
      }
    } finally {
      setUser(DEV_AUTH_BYPASS ? DEMO_USER : null);
      setLoading(false);
    }
  }, []);

  const patchUser = useCallback((updates) => {
    setUser((prev) => {
      if (!prev) return prev;
      const { name: _stale, ...rest } = prev;
      return normalizeUser({ ...rest, ...updates });
    });
  }, []);

  const value = useMemo(
    () => ({
      user,
      loading,
      error,
      login,
      signup,
      logout,
      patchUser,
      isAuthenticated: Boolean(user),
      isDevAuthBypass: DEV_AUTH_BYPASS,
    }),
    [user, loading, error, login, signup, logout, patchUser]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
