import AppBar from "@mui/material/AppBar";
import Toolbar from "@mui/material/Toolbar";
import { Button, Stack } from "@mui/material";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuthStore } from "@/stores/auth-store";
import { Role } from "@/types/shared.types";
import { useUser } from "@/hooks/useUser";

interface NavItem {
  path: string;
  label: string;
  requiredRoles?: Role[];
}

export default function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const logout = useAuthStore((state) => state.logout);
  const { user } = useUser();
  const userRole = user?.role.toUpperCase() as Role;

  const navItems: NavItem[] = [
    { path: "/", label: "Home" },
    { path: "/me", label: "Profile" },
    { path: "/promotions", label: "Promotions" },
    { path: "/events", label: "Events" },
    { 
      path: "/transactions", 
      label: "Transactions",
      requiredRoles: [Role.CASHIER, Role.MANAGER, Role.SUPERUSER]
    },
    { 
      path: "/transactions/history", 
      label: "Transaction History",
      requiredRoles: [Role.CASHIER, Role.MANAGER, Role.SUPERUSER]
    },
    { 
      path: "/users", 
      label: "Users",
      requiredRoles: [Role.MANAGER, Role.SUPERUSER]
    },
    { 
      path: "/signup", 
      label: "Create User",
      requiredRoles: [Role.CASHIER, Role.MANAGER, Role.SUPERUSER]
    },
    { path: "/reset-password", label: "Reset Password" },
  ];

  const hasAccess = (item: NavItem): boolean => {
    if (!item.requiredRoles) return true;
    if (!user) return false;
    return item.requiredRoles.includes(userRole);
  };

  const visibleNavItems = navItems.filter(item => hasAccess(item));

  return (
    <AppBar position="sticky">
      <Toolbar>
        <Stack direction="row" spacing={2} sx={{ flexGrow: 1 }}>
          {visibleNavItems.map((item) => (
            <Button
              key={item.path}
              color="inherit"
              onClick={() => navigate(item.path)}
              sx={{
                backgroundColor:
                  location.pathname === item.path
                    ? "rgba(255, 255, 255, 0.1)"
                    : "transparent",
                "&:hover": {
                  backgroundColor: "rgba(255, 255, 255, 0.2)",
                },
              }}
            >
              {item.label}
            </Button>
          ))}
        </Stack>

        <Button
          color="inherit"
          onClick={() => {
            logout();
            navigate("/auth");
          }}
        >
          Logout
        </Button>
      </Toolbar>
    </AppBar>
  );
}
