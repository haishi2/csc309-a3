import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import Navbar from "@/components/Navbar";
import PrivateRoutes from "@/components/hoc/PrivateRoute";
import AuthForm from "@/components/auth/AuthForm/AuthForm";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import UserProfile from "@/pages/user-profile";
import Promotions from "@/pages/promotions";
import { LocalizationProvider } from "@mui/x-date-pickers";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";

const queryClient = new QueryClient();

const AppContent = () => {
  const location = useLocation();
  const isAuthPage = location.pathname === "/auth";

  return (
    <>
      {!isAuthPage && <Navbar />}

      <Routes>
        {/* public routes */}
        <Route path="/auth" element={<AuthForm />} />

        {/* private routes */}
        <Route element={<PrivateRoutes />}>
          <Route path="/" element={<UserProfile />} />
          <Route path="/me" element={<UserProfile />} />
          <Route path="/promotions" element={<Promotions />} />
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
