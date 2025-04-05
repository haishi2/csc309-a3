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
import Users from "@/pages/users";
import { Role } from "@/types/shared.types";
import TransactionHistory from "@/components/TransactionHistory";
import AllTransactions from "@/pages/all-transactions";
import TransactionDetails from "@/pages/transaction-details";
import PasswordResetPage from "@/pages/password-reset";
import SignupPage from "@/pages/signup";

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
            <Route
              path="/transactions/history"
              element={<TransactionHistory />}
            />
            <Route path="/transactions/all" element={<AllTransactions />} />
            <Route path="/transactions/:id" element={<TransactionDetails />} />
          </Route>
          <Route path="/users" element={<Users />} />
          <Route
            element={
              <RoleRestrictedRoute
                allowedRoles={[Role.CASHIER, Role.MANAGER, Role.SUPERUSER]}
              />
            }
          >
            <Route path="/signup" element={<SignupPage />} />
          </Route>
        </Route>

        <Route path="/reset-password" element={<PasswordResetPage />} />
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
