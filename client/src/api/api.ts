import axios, { AxiosHeaders } from "axios";

export const api = axios.create({
  baseURL: import.meta.env.VITE_BACKEND_URL,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  const userStr = localStorage.getItem("user");
  const hasUsableToken = token && token !== "undefined" && token !== "null";
  const headers =
    config.headers instanceof AxiosHeaders
      ? config.headers
      : new AxiosHeaders(config.headers);

  if (hasUsableToken) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  // Add user info to headers for simplified auth
  if (userStr) {
    try {
      const user = JSON.parse(userStr);
      headers.set("x-user-id", user.uid || user.id || "");
      headers.set("x-user-email", user.email || "");
      headers.set("x-user-name", user.name || user.displayName || "");
      headers.set("x-user-role", user.role || "faculty");
      headers.set("x-college", user.college || "");
      headers.set("x-department", user.department || "");
    } catch (e) {
      console.error("Failed to parse user data:", e);
    }
  }

  config.headers = headers;

  return config;
});
