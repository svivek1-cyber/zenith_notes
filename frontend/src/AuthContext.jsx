import { createContext, useContext, useEffect, useState } from "react";

const AuthContext = createContext(null);

export const request = async (path, options = {}) => {
  const response = await fetch(`/api${path}`, {
    ...options,
    credentials: "include",
    headers: { "Content-Type": "application/json", ...options.headers },
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.message || "Something went wrong");
  return data;
};

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    request("/me")
      .then((data) => setUser(data.user))
      .catch(() => setUser(null))
      .finally(() => setIsLoading(false));
  }, []);

  const login = async (credentials) => {
    const data = await request("/login", {
      method: "POST",
      body: JSON.stringify(credentials),
    });
    setUser(data.user);
  };

  const signup = async (profile) => {
    const data = await request("/signup", {
      method: "POST",
      body: JSON.stringify(profile),
    });
    setUser(data.user);
  };

  const logout = async () => {
    await request("/logout", { method: "POST" });
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, login, signup, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
