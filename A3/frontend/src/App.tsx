import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import Navbar from "@/components/Navbar";
import PrivateRoutes from "@/components/hoc/PrivateRoute";
import RoleRestrictedRoute from "@/components/hoc/RoleRestrictedRoute";
import AuthPage from "@/pages/auth";
import UserProfilePage from "@/pages/user-profile";
import Promotions from "@/pages/promotions";
import { LocalizationProvider } from "@mui/x-date-pickers";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import Events from "@/pages/events";
import Transactions from "@/pages/transactions";
import { Role } from "@/types/shared.types";

const queryClient = new QueryClient();

const AppContent = () => {
  const location = useLocation();
  const isAuthPage = location.pathname === "/auth";

  return (
    <>
      {!isAuthPage && <Navbar />}

      <Routes>
        {/* public routes */}
        <Route path="/auth" element={<AuthPage />} />

        {/* private routes */}
        <Route element={<PrivateRoutes />}>
          <Route path="/" element={<UserProfilePage />} />
          <Route path="/me" element={<UserProfilePage />} />
          <Route path="/promotions" element={<Promotions />} />
          <Route path="/events" element={<Events />} />

          {/* role protected route */}
          <Route
            element={
              <RoleRestrictedRoute
                allowedRoles={[Role.CASHIER, Role.MANAGER, Role.SUPERUSER]}
              />
            }
          >
            <Route path="/transactions" element={<Transactions />} />
          </Route>
        </Route>
      </Routes>
    </>
  );
};

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <LocalizationProvider dateAdapter={AdapterDateFns}>
        <BrowserRouter>
          <AppContent />
        </BrowserRouter>
      </LocalizationProvider>
    </QueryClientProvider>
  );
}
