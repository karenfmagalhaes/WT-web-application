import { createContext, useCallback, useEffect, useMemo, useState } from "react";
import { getMe, loginUser, logoutUser, signupUser } from "../api/authApi";
import { DEV_AUTH_BYPASS } from "../utils/env";

export const AuthContext = createContext(null);
const DEMO_USER = {
  _id: "demo-user",
  id: "demo-user",
  name: "Demo User",
  email: "demo@local.dev",
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
        const { data } = await getMe();
        setUser(data);
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
      localStorage.setItem("token", data.token);
      setUser(data.user);
      return data.user;
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

      const { data } = await signupUser(credentials);
      localStorage.setItem("token", data.token);
      setUser(data.user);
      return data.user;
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
      if (DEV_AUTH_BYPASS) {
        setUser(DEMO_USER);
        return;
      }

      await logoutUser();
    } finally {
      if (!DEV_AUTH_BYPASS) {
        localStorage.removeItem("token");
        setUser(null);
      }
      setLoading(false);
    }
  }, []);

  const value = useMemo(
    () => ({
      user,
      loading,
      error,
      login,
      signup,
      logout,
      isAuthenticated: Boolean(user),
      isDevAuthBypass: DEV_AUTH_BYPASS,
    }),
    [user, loading, error, login, signup, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
