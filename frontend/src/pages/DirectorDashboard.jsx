import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

export default function DirectorDashboard() {
  const navigate = useNavigate();

  // Защита панели директора
  useEffect(() => {
    if (!localStorage.getItem("director")) {
      navigate("/admin-dashboard");
    }
  }, [navigate]);

  // Функция выхода
  function logoutDirector() {
    localStorage.removeItem("director");
    navigate("/admin-dashboard");
  }

  return (
    <div style={{ padding: 40 }}>
      <h1>Панель директора</h1>

      <button
        onClick={logoutDirector}
        style={{
          padding: "10px 20px",
          background: "#333",
          color: "white",
          borderRadius: 8,
          cursor: "pointer",
          marginTop: 20
        }}
      >
        Выйти
      </button>
    </div>
  );
}
