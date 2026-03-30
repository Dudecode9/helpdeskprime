import { Routes, Route } from "react-router-dom";
import { useState } from "react"; // ← ЭТО ВАЖНО!
import HomePage from "./pages/HomePage";
import AdminLogin from "./pages/AdminLogin";
import AdminDashboard from "./pages/AdminDashboard";

function App() {
  const [count, setCount] = useState(0);

  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/user" element={<h2>User Page</h2>} />
      <Route path="/admin" element={<h2>Admin Page</h2>} />
      <Route path="/admin-login" element={<AdminLogin />} />
      <Route path="/admin-dashboard" element={<AdminDashboard />} />
    </Routes>
  );
}

export default App;
