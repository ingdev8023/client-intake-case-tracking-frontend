import { Navigate } from "react-router-dom";
import { useAuth } from "./AuthProvider.jsx";

export function AdminRoute({ children }) {
  const { isAdmin } = useAuth();
  return isAdmin ? children : <Navigate to="/dashboard" replace />;
}
