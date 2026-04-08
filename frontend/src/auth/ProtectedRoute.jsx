import { Navigate } from "react-router-dom";
import { useAuth } from "./AuthContext";

export default function ProtectedRoute({ children, role }) {
  const { user, loading } = useAuth();

  if (loading) {
    return null;
  }

  if (!user) {
    return <Navigate to="/admin-login" replace />;
  }

  if (role && user.role !== role) {
    return <Navigate to={user.role === "director" ? "/director-dashboard" : "/admin-dashboard"} replace />;
  }

  return children;
}
