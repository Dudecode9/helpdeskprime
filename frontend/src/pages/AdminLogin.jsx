import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import { apiFetch } from "../lib/api";
import { validateLoginForm } from "../utils/validation";

function getErrorMessage(error) {
  const validationError = error?.data?.errors?.[0]?.message;
  return validationError || error?.message || "Login failed";
}

export default function AdminLogin() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const { user, loading, refreshAuth } = useAuth();

  useEffect(() => {
    if (loading) return;
    if (user?.role === "director") navigate("/director-dashboard", { replace: true });
    if (user?.role === "admin") navigate("/admin-dashboard", { replace: true });
  }, [loading, navigate, user]);

  async function handleLogin(e) {
    e.preventDefault();
    setError("");
    const validationError = validateLoginForm({ email, password });

    if (validationError) {
      setError(validationError);
      return;
    }

    try {
      await apiFetch("/api/auth/login/admin", {
        method: "POST",
        body: { email: email.trim(), password },
        skipRefresh: true,
      });
      await refreshAuth();
      navigate("/admin-dashboard", { replace: true });
    } catch (loginError) {
      setError(getErrorMessage(loginError));
    }
  }

  return (
    <div style={pageStyle}>
      <div style={brandStyle}>HelpDesk</div>
      <h2 style={titleStyle}>Admin Login</h2>

      <form onSubmit={handleLogin} style={formStyle}>
        <label style={labelStyle}>Email</label>
        <input
          type="email"
          maxLength={255}
          placeholder="Enter admin email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          style={inputStyle}
        />

        <label style={labelStyle}>Password</label>
        <input
          type="password"
          maxLength={72}
          placeholder="Enter password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          style={inputStyle}
        />

        {error && <p style={errorStyle}>{error}</p>}

        <button type="submit" style={primaryButtonStyle}>
          Sign In
        </button>

        <button onClick={() => navigate("/")} type="button" style={secondaryButtonStyle}>
          Back
        </button>
      </form>
    </div>
  );
}

const pageStyle = {
  padding: 40,
  maxWidth: 450,
  margin: "0 auto",
  background: "#0f0f0f",
  minHeight: "100vh",
  color: "white",
  fontFamily: "Poppins, sans-serif",
};

const brandStyle = {
  background: "#1a1a1a",
  color: "white",
  padding: "18px 20px",
  borderRadius: 12,
  textAlign: "center",
  fontSize: 30,
  fontWeight: "bold",
  marginBottom: 35,
  boxShadow: "0 4px 12px rgba(0,0,0,0.5)",
  border: "1px solid #333",
  fontFamily: "Oswald, sans-serif",
  letterSpacing: "2px",
  textTransform: "uppercase",
};

const titleStyle = {
  textAlign: "center",
  marginBottom: 25,
  fontFamily: "Oswald, sans-serif",
  fontSize: 26,
  letterSpacing: "1px",
  color: "#d00000",
};

const formStyle = {
  background: "#1a1a1a",
  padding: 25,
  borderRadius: 12,
  boxShadow: "0 4px 15px rgba(0,0,0,0.5)",
  border: "1px solid #333",
};

const labelStyle = { fontWeight: "600", fontSize: 15 };

const inputStyle = {
  width: "100%",
  padding: 12,
  marginTop: 6,
  marginBottom: 18,
  borderRadius: 8,
  border: "1px solid #333",
  background: "#111",
  color: "white",
  fontSize: 16,
};

const errorStyle = {
  color: "#ff4d4d",
  marginBottom: 10,
  fontWeight: "bold",
  fontSize: 14,
};

const primaryButtonStyle = {
  width: "100%",
  padding: "12px 0",
  background: "#d00000",
  color: "white",
  borderRadius: 8,
  cursor: "pointer",
  border: "none",
  fontSize: 18,
  fontFamily: "Oswald, sans-serif",
  letterSpacing: "1px",
  textTransform: "uppercase",
  transition: "0.2s",
};

const secondaryButtonStyle = {
  width: "100%",
  padding: "10px 0",
  background: "#333",
  color: "white",
  borderRadius: 8,
  cursor: "pointer",
  border: "none",
  fontSize: 16,
  marginTop: 20,
  fontFamily: "Poppins, sans-serif",
};
