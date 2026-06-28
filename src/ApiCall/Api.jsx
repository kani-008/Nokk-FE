import axios from "axios";
import { useAuthStore } from "../components/store/AuthStore";

export const API_URL = import.meta.env.VITE_LHOST_API_URL || "/api";

// Create the main Axios instance
const API = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Request Interceptor: Automatically inject Authorization token if available in store
API.interceptors.request.use(
  (config) => {
    const { token } = useAuthStore.getState();
    if (token && !config.headers.Authorization) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Single in-flight refresh promise shared across all concurrent 401 responses.
// Without this, if 3 requests expire at the same time all 3 would independently
// call /refresh-token — wasting calls now, and breaking outright if refresh
// tokens are ever rotated (the 2nd and 3rd calls would use an already-invalidated token).
let refreshPromise = null;

// Response Interceptor: silent token refresh on 401
API.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Only intercept first-time 401s — anything else passes through as-is
    if (!error.response || error.response.status !== 401 || originalRequest._retry) {
      return Promise.reject(error);
    }

    originalRequest._retry = true;
    const { refreshToken, setAccessToken, logout } = useAuthStore.getState();

    if (!refreshToken) {
      logout();
      return Promise.reject(new Error("Session expired. Please log in again."));
    }

    try {
      // Reuse the in-flight refresh if one is already running (deduplication).
      // All concurrent 401 responses await the same single refresh call.
      if (!refreshPromise) {
        refreshPromise = axios
          .post(`${API_URL}/auth/refresh-token`, { refreshToken })
          .finally(() => { refreshPromise = null; });
      }

      const res = await refreshPromise;

      if (!res.data?.accessToken) {
        logout();
        return Promise.reject(new Error("Session expired. Please log in again."));
      }

      setAccessToken(res.data.accessToken);
      originalRequest.headers.Authorization = `Bearer ${res.data.accessToken}`;
      return API(originalRequest);
    } catch (refreshErr) {
      // Only force-logout when the server explicitly rejected the refresh token.
      // A network error (refreshErr.response is undefined) means the server was
      // temporarily unreachable — keep the user logged in so they can retry once
      // connectivity is restored (important on cold-start deploys).
      const status = refreshErr.response?.status;
      if (status === 401 || status === 403) {
        logout();
      }
      return Promise.reject(refreshErr);
    }
  }
);

export default API;

// named export helper to set tokens directly in the auth store (matching reference style)
export const setTokens = ({ accessToken, refreshToken }) => {
  useAuthStore.setState({ token: accessToken, refreshToken });
};