import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

export default function AdminDashboard() {
  const navigate = useNavigate();

  const adminEmail = localStorage.getItem("adminEmail");
  const director = localStorage.getItem("director");

  // 🔥 Правильная защита — только через useEffect
  useEffect(() => {
    if (director) {
      navigate("/director-dashboard");
    } else if (!adminEmail) {
      navigate("/admin-login");
    }
  }, [navigate, director, adminEmail]);

  // Пока идёт редирект — ничего не рендерим
  if (director || !adminEmail) {
    return null;
  }

  // --- ЕСЛИ МЫ ЗДЕСЬ — АДМИН ТОЧНО АВТОРИЗОВАН ---
  const [tickets, setTickets] = useState([]);
  const [completed, setCompleted] = useState([]);

  const [showDirectorModal, setShowDirectorModal] = useState(false);
  const [directorPassword, setDirectorPassword] = useState("");
  const [directorError, setDirectorError] = useState("");

  // Загрузка активных заявок
  async function loadTickets() {
    const res = await fetch("http://localhost:5000/api/tickets/all");
    const data = await res.json();
    if (data.success) setTickets(data.tickets);
  }

  // Загрузка закрытых заявок
  async function loadCompleted() {
    const res = await fetch("http://localhost:5000/api/tickets/completed");
    const data = await res.json();
    if (data.success) setCompleted(data.tickets);
  }

  useEffect(() => {
    loadTickets();
    loadCompleted();
  }, []);

  // Закрыть заявку
  async function closeTicket(id) {
    const res = await fetch(`http://localhost:5000/api/tickets/close/${id}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ adminEmail }),
    });

    const data = await res.json();

    if (data.success) {
      setTickets((prev) => prev.filter((t) => t.id !== id));
      loadCompleted();
    }
  }

  // ЛОГИН ДИРЕКТОРА
  async function handleDirectorLogin() {
    setDirectorError("");

    const res = await fetch("http://localhost:5000/api/director/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: "director@gmail.com",
        password: directorPassword,
      }),
    });

    const data = await res.json();

    if (!data.success) {
      setDirectorError("Неверный пароль");
      return;
    }

    localStorage.setItem("director", "true");
    setShowDirectorModal(false);
    navigate("/director-dashboard");
  }

  // 🔥 ВЫХОД АДМИНА
  function logoutAdmin() {
    localStorage.removeItem("adminEmail");
    localStorage.removeItem("admin");
    navigate("/admin-login");
  }

  return (
    <div style={{ padding: 40 }}>
      <h1>Панель администратора</h1>

      <p style={{ marginBottom: 20, fontSize: 18 }}>
        <b>Вы вошли как:</b> {adminEmail}
      </p>

      <button
        onClick={logoutAdmin}
        style={{
          padding: "8px 16px",
          background: "#444",
          color: "white",
          borderRadius: 6,
          cursor: "pointer",
          marginBottom: 30
        }}
      >
        Выйти
      </button>

      <h2>Активные заявки</h2>

      {tickets.map((ticket) => (
        <div key={ticket.id} style={{ border: "1px solid #ccc", padding: 10, marginBottom: 10 }}>
          <p><b>Email:</b> {ticket.email}</p>
          <p><b>Телефон:</b> {ticket.phone}</p>
          <p><b>Сообщение:</b> {ticket.message}</p>

          <button onClick={() => closeTicket(ticket.id)}>
            Закрыть
          </button>
        </div>
      ))}

      <hr />

      <h2>Закрытые заявки</h2>

      {completed.map((ticket) => (
        <div key={ticket.id} style={{ border: "1px solid #aaa", padding: 10, marginBottom: 10 }}>
          <p><b>Email:</b> {ticket.email}</p>
          <p><b>Телефон:</b> {ticket.phone}</p>
          <p><b>Сообщение:</b> {ticket.message}</p>
          <p><b>Закрыто администратором:</b> {ticket.admin_email}</p>
        </div>
      ))}

      <button
        onClick={() => setShowDirectorModal(true)}
        style={{
          marginTop: 30,
          padding: "10px 20px",
          background: "#333",
          color: "white",
          borderRadius: 8,
          cursor: "pointer"
        }}
      >
        Вход директора
      </button>

      {showDirectorModal && (
        <div style={{
          position: "fixed",
          top: 0,
          left: 0,
          width: "100%",
          height: "100%",
          background: "rgba(0,0,0,0.5)",
          display: "flex",
          justifyContent: "center",
          alignItems: "center"
        }}>
          <div style={{
            background: "white",
            padding: 30,
            borderRadius: 10,
            width: 350
          }}>
            <h3>Введите пароль директора</h3>

            <input
              type="password"
              placeholder="Пароль"
              value={directorPassword}
              onChange={(e) => setDirectorPassword(e.target.value)}
              style={{ width: "100%", padding: 10, marginTop: 10 }}
            />

            {directorError && <p style={{ color: "red" }}>{directorError}</p>}

            <div style={{ marginTop: 20, display: "flex", gap: 10 }}>
              <button
                onClick={handleDirectorLogin}
                style={{
                  flex: 1,
                  padding: "10px 15px",
                  background: "#333",
                  color: "white",
                  borderRadius: 6
                }}
              >
                Войти
              </button>

              <button
                onClick={() => setShowDirectorModal(false)}
                style={{
                  flex: 1,
                  padding: "10px 15px",
                  background: "#aaa",
                  color: "white",
                  borderRadius: 6
                }}
              >
                Отмена
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
