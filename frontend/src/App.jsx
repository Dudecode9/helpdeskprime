import { Routes, Route } from "react-router-dom";
import { useState } from "react";

import HomePage from "./pages/HomePage";
import AdminLogin from "./pages/AdminLogin";
import AdminDashboard from "./pages/AdminDashboard";
import UserPage from "./pages/UserPage";
import DirectorDashboard from "./pages/DirectorDashboard"; // ← добавили

function App() {
  const [count, setCount] = useState(0);

  return (
    <Routes>
  <Route path="/" element={<HomePage />} />
  <Route path="/admin-login" element={<AdminLogin />} />
  <Route path="/admin-dashboard" element={<AdminDashboard />} />
  <Route path="/director-dashboard" element={<DirectorDashboard />} />
  <Route path="/user" element={<UserPage />} />
    </Routes>
  );
}

export default App;
