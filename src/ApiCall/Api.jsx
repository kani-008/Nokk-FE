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
      (error.response.status === 401 || error.response.status === 403) &&
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

// apiFetch wrapper to preserve backward compatibility across all stores and components
export async function apiFetch(url, options = {}) {
  // Extract relative URL if absolute API URL is passed
  let relativeUrl = url;
  if (url.startsWith(API_URL)) {
    relativeUrl = url.substring(API_URL.length);
  }

  // Parse string body if provided
  let requestData = options.body;
  if (typeof options.body === "string") {
    try {
      requestData = JSON.parse(options.body);
    } catch {
      // Keep original text/body if JSON parsing fails (e.g. FormData/raw text)
    }
  }

  try {
    const response = await API.request({
      url: relativeUrl,
      method: options.method || "GET",
      headers: options.headers,
      data: requestData,
    });
    return response.data;
  } catch (error) {
    if (error.response) {
      throw new Error(error.response.data?.message || `Request failed (${error.response.status})`);
    } else if (error.request) {
      throw new Error("Cannot connect to server — is the backend running?");
    } else {
      throw new Error(error.message);
    }
  }
}