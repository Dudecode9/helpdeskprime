import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

export default function AdminLogin() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    const adminEmail = localStorage.getItem("adminEmail");
    const adminFlag = localStorage.getItem("admin");
    const director = localStorage.getItem("director");

    if (director === "true") {
      navigate("/director-dashboard");
    } else if (adminEmail && adminFlag === "true") {
      navigate("/admin-dashboard");
    }
  }, [navigate]);

  async function handleLogin(e) {
    e.preventDefault();
    setError("");

    const res = await fetch("http://localhost:5000/api/admin/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    const data = await res.json();

    if (!data.success) {
      setError(data.message);
      return;
    }

    localStorage.setItem("adminEmail", email);
    localStorage.setItem("admin", "true");

    navigate("/admin-dashboard");
  }

  return (
    <div
      style={{
        padding: 40,
        maxWidth: 450,
        margin: "0 auto",
        background: "#0f0f0f",
        minHeight: "100vh",
        color: "white",
        fontFamily: "Poppins, sans-serif"
      }}
    >
      {/* 🔥 Шапка */}
      <div
        style={{
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
          textTransform: "uppercase"
        }}
      >
        HelpDesk
      </div>

      <h2
        style={{
          textAlign: "center",
          marginBottom: 25,
          fontFamily: "Oswald, sans-serif",
          fontSize: 26,
          letterSpacing: "1px",
          color: "#d00000"
        }}
      >
        Admin Login
      </h2>

      <form
        onSubmit={handleLogin}
        style={{
          background: "#1a1a1a",
          padding: 25,
          borderRadius: 12,
          boxShadow: "0 4px 15px rgba(0,0,0,0.5)",
          border: "1px solid #333"
        }}
      >
        {/* Email */}
        <label style={{ fontWeight: "600", fontSize: 15 }}>Email</label>
        <input
          type="email"
          maxLength={20}
          placeholder="Введите email (до 20 символов)"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          style={{
            width: "100%",
            padding: 12,
            marginTop: 6,
            marginBottom: 18,
            borderRadius: 8,
            border: "1px solid #333",
            background: "#111",
            color: "white",
            fontSize: 16
          }}
        />

        {/* Пароль */}
        <label style={{ fontWeight: "600", fontSize: 15 }}>Пароль</label>
        <input
          type="password"
          maxLength={20}
          placeholder="Введите пароль (до 20 символов)"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          style={{
            width: "100%",
            padding: 12,
            marginTop: 6,
            marginBottom: 18,
            borderRadius: 8,
            border: "1px solid #333",
            background: "#111",
            color: "white",
            fontSize: 16
          }}
        />

        {/* Ошибка */}
        {error && (
          <p
            style={{
              color: "#ff4d4d",
              marginBottom: 10,
              fontWeight: "bold",
              fontSize: 14
            }}
          >
            {error}
          </p>
        )}

        {/* Кнопка входа */}
        <button
          type="submit"
          style={{
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
            transition: "0.2s"
          }}
        >
          Войти
        </button>

        {/* Кнопка назад */}
        <button
          onClick={() => navigate("/")}
          type="button"
          style={{
            width: "100%",
            padding: "10px 0",
            background: "#333",
            color: "white",
            borderRadius: 8,
            cursor: "pointer",
            border: "none",
            fontSize: 16,
            marginTop: 20,
            fontFamily: "Poppins, sans-serif"
          }}
        >
          ← Назад к выбору роли
        </button>
      </form>
    </div>
  );
}
