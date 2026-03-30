import { Routes, Route } from "react-router-dom";
import { useState } from "react"; // ← ЭТО ВАЖНО!
import HomePage from "./pages/HomePage";
import AdminLogin from "./pages/AdminLogin";
import AdminDashboard from "./pages/AdminDashboard";
import UserPage from "./pages/UserPage";


function App() {
  const [count, setCount] = useState(0);

  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/admin" element={<h2>Admin Page</h2>} />
      <Route path="/admin-login" element={<AdminLogin />} />
      <Route path="/admin-dashboard" element={<AdminDashboard />} />
      <Route path="/user" element={<UserPage />} />
    </Routes>
  );
}

export default App;
