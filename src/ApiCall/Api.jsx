import axios from "axios";
import { useAuthStore } from "../components/store/AuthStore";

export const API_URL = import.meta.env.VITE_LHOST_API_URL;

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

// Response Interceptor: Intercept 401/403 errors and attempt a silent token refresh
API.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    if (
      error.response &&
      error.response.status === 401 &&
      !originalRequest._retry
    ) {
      originalRequest._retry = true;
      const { refreshToken, setAccessToken, logout } = useAuthStore.getState();
      if (refreshToken) {
        try {
          // Use standard axios to perform refresh post so we don't trigger the interceptor request loop
          const res = await axios.post(`${API_URL}/auth/refresh-token`, { refreshToken });
          if (res.data && res.data.accessToken) {
            setAccessToken(res.data.accessToken);
            originalRequest.headers.Authorization = `Bearer ${res.data.accessToken}`;
            return API(originalRequest);
          }
        } catch (refreshErr) {
          console.error("Silent token refresh failed:", refreshErr);
        }
      }
      // Log out if token refresh fails or no refresh token is found
      logout();
      return Promise.reject(new Error("Session expired. Please log in again."));
    }
    return Promise.reject(error);
  }
);

export default API;

// named export helper to set tokens directly in the auth store (matching reference style)
export const setTokens = ({ accessToken, refreshToken }) => {
  useAuthStore.setState({ token: accessToken, refreshToken });
};