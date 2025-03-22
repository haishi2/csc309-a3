import { BrowserRouter, Routes, Route } from "react-router-dom";
import Test1 from "@/components/Test1";
import Test2 from "@/components/Test2";
import Navbar from "@/components/Navbar";
function App() {
  return (
    <BrowserRouter>
      <Navbar />
      <Routes>
        <Route path="/" element={<Test1 />} />
        <Route path="/test2" element={<Test2 />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
