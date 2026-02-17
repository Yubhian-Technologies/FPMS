import axios from "axios";

export const api = axios.create({
  baseURL: import.meta.env.VITE_BACKEND_URL,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  const userStr = localStorage.getItem("user");

  if (token) {
    config.headers = config.headers ?? {};
    config.headers.Authorization = `Bearer ${token}`;
  }

  // Add user info to headers for simplified auth
  if (userStr) {
    try {
      const user = JSON.parse(userStr);
      config.headers = config.headers ?? {};
      config.headers["x-user-id"] = user.uid || user.id || "";
      config.headers["x-user-email"] = user.email || "";
      config.headers["x-user-name"] = user.name || user.displayName || "";
      config.headers["x-user-role"] = user.role || "faculty";
      config.headers["x-college"] = user.college || "";
      config.headers["x-department"] = user.department || "";
    } catch (e) {
      console.error("Failed to parse user data:", e);
    }
  }

  return config;
});
