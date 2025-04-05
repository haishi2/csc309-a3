import AppBar from "@mui/material/AppBar";
import Toolbar from "@mui/material/Toolbar";
import { Button, Stack } from "@mui/material";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuthStore } from "@/stores/auth-store";
import { Role } from "@/types/shared.types";
import { useUser } from "@/hooks/useUser";

export default function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const logout = useAuthStore((state) => state.logout);
  const { user } = useUser();

  const navItems = [
    { path: "/", label: "Home" },
    { path: "/me", label: "Profile" },
    { path: "/promotions", label: "Promotions" },
    { path: "/events", label: "Events" },
    { path: "/transactions", label: "Transactions" },
    { path: "/transactions/history", label: "Transaction History" },
    ...(user?.role.toUpperCase() === Role.MANAGER ||
    user?.role.toUpperCase() === Role.SUPERUSER
      ? [{ path: "/users", label: "Users" }]
      : []),
    { path: "/reset-password", label: "Reset Password" },
    { path: "/signup", label: "Signup" },
  ];

  return (
    <AppBar position="sticky">
      <Toolbar>
        <Stack direction="row" spacing={2} sx={{ flexGrow: 1 }}>
          {navItems.map((item) => (
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
