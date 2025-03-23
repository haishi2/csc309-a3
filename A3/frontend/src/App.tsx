import { BrowserRouter, Routes, Route } from "react-router-dom";
import Test1 from "@/components/Test1";
import Test2 from "@/components/Test2";
import Navbar from "@/components/Navbar";
import Login from "@/pages/login";
import PrivateRoutes from "@/components/hoc/PrivateRoute";

export default function App() {
  return (
    <BrowserRouter>
      <Navbar />
      <Routes>
        {/* public routes */}
        <Route path="/login" element={<Login />} />

        {/* private routes */}
        <Route element={<PrivateRoutes />}>
          <Route path="/" element={<Test1 />} />
          <Route path="/test2" element={<Test2 />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}