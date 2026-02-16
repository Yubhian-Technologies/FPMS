import { createContext, useContext, useEffect, useState } from "react";
import { api } from "@/api/api";

type Role =
  | "committee"
  | "principle"
  | "hod"
  | "dean"
  | "faculty"
  | "superadmin";

interface User {
  id?: string;
  name: string;
  email: string;
  role: Role;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<User | null>;
  logout: () => void;
  setDemoUser: (role: Role) => void;
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    const token = localStorage.getItem("token");

    if (storedUser && token) {
      setUser(JSON.parse(storedUser));
      api.defaults.headers.common["Authorization"] = `Bearer ${token}`;
    }

    setIsLoading(false);
  }, []);

  const login = async (
    email: string,
    password: string,
  ): Promise<User | null> => {
    try {
      const unified = await api.post("/api/committee/unified-login", {
        email,
        password,
      });
      if (unified.data?.success) {
        localStorage.setItem("token", unified.data.token);
        localStorage.setItem("user", JSON.stringify(unified.data.user));

        api.defaults.headers.common["Authorization"] =
          `Bearer ${unified.data.token}`;
        setUser(unified.data.user);

        return unified.data.user;
      }
    } catch (err) {}

    const endpoints = [
      { role: "faculty", url: "/api/faculty/login" },
      { role: "hod", url: "/api/hod/login" },
      { role: "dean", url: "/api/dean/login" },
      { role: "admin", url: "/api/admin/login" },
      { role: "committee", url: "/api/committee/login" },
    ];

    for (const ep of endpoints) {
      try {
        const res = await api.post(ep.url, { email, password });
        if (res.data.success) {
          localStorage.setItem("token", res.data.token);
          localStorage.setItem("user", JSON.stringify(res.data.user));

          api.defaults.headers.common["Authorization"] =
            `Bearer ${res.data.token}`;
          setUser(res.data.user);

          return res.data.user;
        }
      } catch (err) {}
    }

    return null;
  };

  const logout = () => {
    localStorage.clear();
    delete api.defaults.headers.common["Authorization"];
    setUser(null);
  };

  const setDemoUser = (role: Role) => {
    const demoUser: User = {
      id: "demo-" + role,
      name: role === "superadmin" ? "Super Admin" : "Demo User",
      email: `${role}@demo.com`,
      role: role,
    };
    localStorage.setItem("user", JSON.stringify(demoUser));
    localStorage.setItem("token", "demo-token-" + role);
    api.defaults.headers.common["Authorization"] = `Bearer demo-token-${role}`;
    setUser(demoUser);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        logout,
        setDemoUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
