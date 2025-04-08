import AppBar from "@mui/material/AppBar";
import Toolbar from "@mui/material/Toolbar";
import { 
  Button, 
  Stack, 
  IconButton, 
  Drawer, 
  List, 
  ListItem, 
  ListItemButton, 
  ListItemText,
  useTheme,
  useMediaQuery,
  Box,
  Typography
} from "@mui/material";
import MenuIcon from "@mui/icons-material/Menu";
import { useState } from "react";
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
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [mobileOpen, setMobileOpen] = useState(false);

  const navItems: NavItem[] = [
    { path: "/", label: "Home" },
    { path: "/me", label: "Profile" },
    { path: "/promotions", label: "Promotions" },
    { path: "/events", label: "Events" },
    { path: "/transactions/history", label: "Transaction History" },
    { 
      path: "/transactions", 
      label: "Process Transactions",
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

  const handleNavigation = (path: string) => {
    navigate(path);
    if (isMobile) {
      setMobileOpen(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate("/auth");
    if (isMobile) {
      setMobileOpen(false);
    }
  };

  const drawer = (
    <Box sx={{ width: 250 }}>
      <List>
        {visibleNavItems.map((item) => (
          <ListItem key={item.path} disablePadding>
            <ListItemButton
              onClick={() => handleNavigation(item.path)}
              selected={location.pathname === item.path}
              sx={{
                backgroundColor: location.pathname === item.path
                  ? "rgba(255, 255, 255, 0.1)"
                  : "transparent",
                "&:hover": {
                  backgroundColor: "rgba(255, 255, 255, 0.2)",
                },
              }}
            >
              <ListItemText primary={item.label} />
            </ListItemButton>
          </ListItem>
        ))}
        <ListItem disablePadding>
          <ListItemButton onClick={handleLogout}>
            <ListItemText primary="Logout" />
          </ListItemButton>
        </ListItem>
      </List>
    </Box>
  );

  return (
    <AppBar position="sticky">
      <Toolbar>
        {isMobile ? (
          <>
            <IconButton
              color="inherit"
              edge="start"
              onClick={() => setMobileOpen(!mobileOpen)}
              sx={{ mr: 2 }}
            >
              <MenuIcon />
            </IconButton>
            <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
              Menu
            </Typography>
            <Drawer
              variant="temporary"
              anchor="left"
              open={mobileOpen}
              onClose={() => setMobileOpen(false)}
              ModalProps={{
                keepMounted: true, // Better open performance on mobile
              }}
              PaperProps={{
                sx: {
                  backgroundColor: theme.palette.primary.main,
                  color: theme.palette.primary.contrastText,
                }
              }}
            >
              {drawer}
            </Drawer>
          </>
        ) : (
          <>
            <Stack direction="row" spacing={2} sx={{ flexGrow: 1 }}>
              {visibleNavItems.map((item) => (
                <Button
                  key={item.path}
                  color="inherit"
                  onClick={() => handleNavigation(item.path)}
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
              onClick={handleLogout}
            >
              Logout
            </Button>
          </>
        )}
      </Toolbar>
    </AppBar>
  );
}
