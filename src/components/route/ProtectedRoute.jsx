import { Navigate, Outlet } from "react-router-dom";
import { useAuthStore } from "../../store/authStore";

/**
 * Protected
 *
 * Props:
 *   adminOnly  {boolean} – also requires role === "admin"
 *   redirectTo {string}  – where to send unauthenticated users (default: /login)
 *
 * Usage in App.jsx:
 *   <Route element={<Protected />}>            — auth only
 *   <Route element={<Protected adminOnly />}>  — admin only
 */
export default function Protected({ adminOnly = false, redirectTo = "/login" }) {
  const { isAuthenticated, user } = useAuthStore();

  // Not logged in → redirect to login
  if (!isAuthenticated) {
    return <Navigate to={redirectTo} replace />;
  }

  // Logged in but not admin → back to home
  if (adminOnly && user?.role !== "admin") {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
}