import { Navigate, Outlet } from "react-router-dom";
import { useAuthStore } from "@/stores/auth-store";

export default function PrivateRoutes() {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  if (!isAuthenticated) {
    return <Navigate to="/auth" replace />;
  }

  return <Outlet />;
}