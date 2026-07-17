import axios from "axios";

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001",
});

api.interceptors.request.use((config) => {
  if (typeof window === "undefined") return config;
  if (config.data instanceof FormData) {
    config.headers.delete("Content-Type");
  } else {
    config.headers.set("Content-Type", "application/json");
  }
  const token = localStorage.getItem("africover_token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 && typeof window !== "undefined") {
      localStorage.removeItem("africover_token");
      localStorage.removeItem("africover_user");
      document.cookie = "africover_token=; path=/; max-age=0";
      window.location.href = "/session-expired";
    }
    return Promise.reject(error);
  },
);

export default api;
