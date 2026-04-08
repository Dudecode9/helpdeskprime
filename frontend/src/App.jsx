import { Routes, Route } from "react-router-dom";
import HomePage from "./pages/HomePage";
import AdminLogin from "./pages/AdminLogin";
import AdminDashboard from "./pages/AdminDashboard";
import UserPage from "./pages/UserPage";
import DirectorDashboard from "./pages/DirectorDashboard";
import ProtectedRoute from "./auth/ProtectedRoute";

function App() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/admin-login" element={<AdminLogin />} />
      <Route
        path="/admin-dashboard"
        element={(
          <ProtectedRoute role="admin">
            <AdminDashboard />
          </ProtectedRoute>
        )}
      />
      <Route
        path="/director-dashboard"
        element={(
          <ProtectedRoute role="director">
            <DirectorDashboard />
          </ProtectedRoute>
        )}
      />
      <Route path="/user" element={<UserPage />} />
    </Routes>
  );
}

export default App;
