import { Navigate, Outlet } from "react-router-dom";
import { useUser } from "@/hooks/useUser";
import { Role } from "@/types/shared.types";
import { CircularProgress, Box } from "@mui/material";

interface RoleRouteProps {
  allowedRoles: Role[];
}

export default function RoleRestrictedRoute({ allowedRoles }: RoleRouteProps) {
  const { user, isLoading } = useUser();

  if (isLoading) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        minHeight="60vh"
      >
        <CircularProgress />
      </Box>
    );
  }

  const hasRequiredRole = user && allowedRoles.includes(user.role.toUpperCase() as Role);

  if (!hasRequiredRole) {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
}
