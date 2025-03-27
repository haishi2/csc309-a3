import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import Navbar from "@/components/Navbar";
import PrivateRoutes from "@/components/hoc/PrivateRoute";
import AuthPage from "@/pages/auth";
import UserProfilePage from "@/pages/user-profile";
import Promotions from "@/pages/promotions";
import { LocalizationProvider } from "@mui/x-date-pickers";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import Events from "@/pages/events";
import Transactions from "@/pages/transactions";

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
          <Route path="/transactions" element={<Transactions />} />
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
