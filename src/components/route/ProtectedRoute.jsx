import { Navigate, Outlet } from "react-router-dom";
import { useAuthStore } from "../store/AuthStore";

/**
 * ProtectedRoute
 * path: src/components/route/ProtectedRoute.jsx
 *
 * Props:
 *   adminOnly  {boolean} — also requires role === "admin"
 *   redirectTo {string}  — where unauthenticated users are sent (default: /login)
 */
export default function ProtectedRoute({ adminOnly = false, redirectTo = "/login" }) {
  const { isAuthenticated, user } = useAuthStore();

  if (!isAuthenticated) return <Navigate to={redirectTo} replace />;
  if (adminOnly && user?.role !== "admin") return <Navigate to="/" replace />;

  return <Outlet />;
}