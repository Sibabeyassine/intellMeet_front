import { Navigate, useLocation } from "react-router-dom";
import { useIsAuthenticated } from "@/store/auth";

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const isAuth = useIsAuthenticated();
  const location = useLocation();
  if (!isAuth) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }
  return <>{children}</>;
}
