import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import Test1 from "@/components/Test1";
import Test2 from "@/components/Test2";
import Navbar from "@/components/Navbar";
import PrivateRoutes from "@/components/hoc/PrivateRoute";
import AuthForm from "@/components/auth/AuthForm/AuthForm";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

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
        <Route path="/test1" element={<Test1 />} />

        {/* private routes */}
        <Route element={<PrivateRoutes />}>
          <Route path="/" element={<Test1 />} />
          <Route path="/test2" element={<Test2 />} />
        </Route>
      </Routes>
    </>
  );
};

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AppContent />
      </BrowserRouter>
    </QueryClientProvider>
  );
}
