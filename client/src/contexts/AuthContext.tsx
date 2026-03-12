import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { api } from "@/api/api";

type Role =
  | "committee"
  | "principle"
  | "admin"
  | "hod"
  | "dean"
  | "faculty"
  | "superadmin";

interface User {
  id?: string;
  uid?: string;
  name: string;
  email: string;
  role: Role;
  college?: string;
  department?: string;
  designation?: string;
  designationTarget?: string;
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

const normalizeStoredUser = (user: User): User => {
  const normalizedRole =
    String(user.role || "").trim().toLowerCase() === "admin"
      ? "principle"
      : user.role;

  return {
    ...user,
    role: normalizedRole,
    college: user.college ?? "",
  };
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    const token = localStorage.getItem("token");
    const hasUsableToken = token && token !== "undefined" && token !== "null";

    if (storedUser && hasUsableToken) {
      const parsed = normalizeStoredUser(JSON.parse(storedUser) as User);
      localStorage.setItem("user", JSON.stringify(parsed));
      setUser(parsed);
      api.defaults.headers.common["Authorization"] = `Bearer ${token}`;

      // Self-heal: if principle has no college stored, fetch it from server
      const isPrinciple = parsed.role === "principle";
      if (isPrinciple && !parsed.college) {
        api
          .get("/api/admin/college-details")
          .then((res) => {
            const college = res.data?.data?.name || "";
            if (college) {
              const updated = { ...parsed, college };
              localStorage.setItem("user", JSON.stringify(updated));
              setUser(updated);
            }
          })
          .catch(() => {});
      }
    }

    if (storedUser && !hasUsableToken) {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      delete api.defaults.headers.common["Authorization"];
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
      if (unified.data?.success && unified.data?.token) {
        const normalizedUser = normalizeStoredUser(unified.data.user);
        localStorage.setItem("token", unified.data.token);
        localStorage.setItem("user", JSON.stringify(normalizedUser));

        api.defaults.headers.common["Authorization"] =
          `Bearer ${unified.data.token}`;
        setUser(normalizedUser);

        return normalizedUser;
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
        if (res.data.success && res.data?.token) {
          console.log("Login successful for role:", ep.role);
          const normalizedUser = normalizeStoredUser(res.data.user);
          localStorage.setItem("token", res.data.token);
          localStorage.setItem("user", JSON.stringify(normalizedUser));

          api.defaults.headers.common["Authorization"] =
            `Bearer ${res.data.token}`;
          setUser(normalizedUser);

          return normalizedUser;
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
      uid: "demo-" + role,
      name: role === "superadmin" ? "Super Admin" : "Demo User",
      email: `${role}@demo.com`,
      role: role,
      college:
        role === "hod" || role === "faculty" || role === "dean"
          ? "Vishnu Institute of Technology"
          : "",
      department: role === "hod" || role === "faculty" ? "CSE" : "",
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
