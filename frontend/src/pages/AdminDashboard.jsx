import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

// ===============================
// 🔥 КОМПОНЕНТ КАРТОЧКИ ЗАЯВКИ
// ===============================
function TicketCard({ ticket, showClose, onClose }) {
  const [expanded, setExpanded] = useState(false);

  function copyText() {
    navigator.clipboard.writeText(ticket.message);
  }

  return (
    <div
      style={{
        background: "#1a1a1a",
        padding: 15,
        borderRadius: 10,
        marginBottom: 15,
        color: "white",
        boxShadow: "0 4px 12px rgba(0,0,0,0.4)",
        fontFamily: "Poppins, sans-serif",
        border: "1px solid #333"
      }}
    >
      <p><b>Email:</b> {ticket.email}</p>
      <p><b>Телефон:</b> {ticket.phone}</p>

      <div
        style={{
          maxHeight: expanded ? "none" : 60,
          overflow: "hidden",
          whiteSpace: "pre-wrap",
          wordBreak: "break-word",
          marginBottom: 10,
          transition: "0.3s"
        }}
      >
        <b>Сообщение:</b> {ticket.message}
      </div>

      <div style={{ display: "flex", gap: 10 }}>
        <button
          onClick={() => setExpanded(!expanded)}
          style={{
            padding: "6px 10px",
            background: "#444",
            borderRadius: 6,
            cursor: "pointer",
            border: "none",
            color: "white"
          }}
        >
          {expanded ? "Свернуть" : "Развернуть"}
        </button>

        <button
          onClick={copyText}
          style={{
            padding: "6px 10px",
            background: "#666",
            borderRadius: 6,
            cursor: "pointer",
            border: "none",
            color: "white"
          }}
        >
          Скопировать
        </button>

        {showClose && (
          <button
            onClick={onClose}
            style={{
              padding: "6px 10px",
              background: "#d00000",
              color: "white",
              borderRadius: 6,
              cursor: "pointer",
              marginLeft: "auto",
              border: "none"
            }}
          >
            Закрыть
          </button>
        )}
      </div>
    </div>
  );
}

// ===============================
// 🔥 ОСНОВНОЙ КОМПОНЕНТ АДМИНА
// ===============================
export default function AdminDashboard() {
  const navigate = useNavigate();

  const adminEmail = localStorage.getItem("adminEmail");
  const adminFlag = localStorage.getItem("admin");
  const director = localStorage.getItem("director");

  useEffect(() => {
    if (director === "true") {
      navigate("/director-dashboard");
    } else if (!adminEmail || adminFlag !== "true") {
      navigate("/admin-login");
    }
  }, [navigate, director, adminEmail, adminFlag]);

  if (director === "true" || !adminEmail || adminFlag !== "true") {
    return null;
  }

  const [tickets, setTickets] = useState([]);
  const [completed, setCompleted] = useState([]);

  const [showDirectorModal, setShowDirectorModal] = useState(false);
  const [directorPassword, setDirectorPassword] = useState("");
  const [directorError, setDirectorError] = useState("");

  async function loadTickets() {
    const res = await fetch("http://localhost:5000/api/tickets/all");
    const data = await res.json();
    if (data.success) setTickets(data.tickets);
  }

  async function loadCompleted() {
    const res = await fetch("http://localhost:5000/api/tickets/completed");
    const data = await res.json();
    if (data.success) setCompleted(data.tickets);
  }

  useEffect(() => {
    loadTickets();
    loadCompleted();
  }, []);

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

  function logoutAdmin() {
    localStorage.removeItem("adminEmail");
    localStorage.removeItem("admin");
    navigate("/admin-login");
  }

  return (
    <div
      style={{
        display: "flex",
        background: "#0f0f0f",
        minHeight: "100vh",
        color: "white",
        fontFamily: "Poppins, sans-serif"
      }}
    >
      {/* ============================
          🔥 ЛЕВАЯ ПАНЕЛЬ — ЗАКРЫТЫЕ
      ============================ */}
      <div
        style={{
          width: "30%",
          background: "#111",
          padding: 20,
          borderRight: "2px solid #222",
          boxShadow: "4px 0 12px rgba(0,0,0,0.4)"
        }}
      >
        <h2 style={{ marginBottom: 20, color: "#d00000" }}>Закрытые заявки</h2>

        {completed.length === 0 && <p>Нет закрытых заявок</p>}

        {completed.map((ticket) => (
          <TicketCard key={ticket.id} ticket={ticket} showClose={false} />
        ))}
      </div>

      {/* ============================
          🔥 ПРАВАЯ ЧАСТЬ — АКТИВНЫЕ
      ============================ */}
      <div style={{ flex: 1, padding: 40 }}>

        {/* 🔥 Кнопка входа директора справа */}
        <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 20 }}>
          <button
            onClick={() => setShowDirectorModal(true)}
            style={{
              padding: "10px 20px",
              background: "#444",
              color: "white",
              borderRadius: 8,
              cursor: "pointer",
              border: "none"
            }}
          >
            Вход директора
          </button>
        </div>

        <h1 style={{ color: "#d00000" }}>Панель администратора</h1>

        <p style={{ marginBottom: 20, fontSize: 18 }}>
          <b>Вы вошли как:</b> {adminEmail}
        </p>

        <button
          onClick={logoutAdmin}
          style={{
            padding: "10px 20px",
            background: "#d00000",
            color: "white",
            borderRadius: 8,
            cursor: "pointer",
            border: "none",
            marginBottom: 30
          }}
        >
          Выйти
        </button>

        <h2 style={{ color: "#d00000" }}>Активные заявки</h2>

        {tickets.length === 0 && <p>Нет активных заявок</p>}

        {tickets.map((ticket) => (
          <TicketCard
            key={ticket.id}
            ticket={ticket}
            showClose={true}
            onClose={() => closeTicket(ticket.id)}
          />
        ))}
      </div>

      {/* ============================
          🔐 МОДАЛКА ДИРЕКТОРА
      ============================ */}
      {showDirectorModal && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            background: "rgba(0,0,0,0.7)",
            display: "flex",
            justifyContent: "center",
            alignItems: "center"
          }}
        >
          <div
            style={{
              background: "#1a1a1a",
              padding: 30,
              borderRadius: 12,
              width: 350,
              color: "white",
              boxShadow: "0 4px 15px rgba(0,0,0,0.5)",
              border: "1px solid #333"
            }}
          >
            <h3 style={{ color: "#d00000" }}>Введите пароль директора</h3>

            <input
              type="password"
              placeholder="Пароль"
              value={directorPassword}
              onChange={(e) => setDirectorPassword(e.target.value)}
              style={{
                width: "100%",
                padding: 12,
                marginTop: 10,
                borderRadius: 8,
                border: "1px solid #333",
                background: "#111",
                color: "white"
              }}
            />

            {directorError && (
              <p style={{ color: "#ff6b6b", marginTop: 10 }}>{directorError}</p>
            )}

            <div style={{ marginTop: 20, display: "flex", gap: 10 }}>
              <button
                onClick={handleDirectorLogin}
                style={{
                  flex: 1,
                  padding: "10px 15px",
                  background: "#d00000",
                  color: "white",
                  borderRadius: 6,
                  border: "none"
                }}
              >
                Войти
              </button>

              <button
                onClick={() => setShowDirectorModal(false)}
                style={{
                  flex: 1,
                  padding: "10px 15px",
                  background: "#444",
                  color: "white",
                  borderRadius: 6,
                  border: "none"
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
