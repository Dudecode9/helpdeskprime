import { Navigate, Route, Routes } from "react-router-dom";
import NetworkDashboard from "./pages/NetworkDashboard";

function App() {
  return (
    <Routes>
      <Route path="/" element={<NetworkDashboard />} />
      <Route path="/network" element={<NetworkDashboard />} />
      <Route path="/login" element={<Navigate to="/network" replace />} />
      <Route path="/admin-login" element={<Navigate to="/network" replace />} />
      <Route path="/network-dashboard" element={<Navigate to="/network" replace />} />
      <Route path="*" element={<Navigate to="/network" replace />} />
    </Routes>
  );
}

export default App;
