import { Navigate } from "react-router-dom";
import { useAuth } from "./AuthContext";

export default function ProtectedRoute({ children, role }) {
  const { user, loading } = useAuth();

  if (loading) {
    return <div className="app-loading">Проверка локальной сессии...</div>;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (role && !(Array.isArray(role) ? role.includes(user.role) : user.role === role)) {
    return <Navigate to="/login" replace />;
  }

  return children;
}
