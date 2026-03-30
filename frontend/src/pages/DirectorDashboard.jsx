import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

export default function DirectorDashboard() {
  const navigate = useNavigate();
  const director = localStorage.getItem("director");

  useEffect(() => {
    if (director !== "true") {
      navigate("/admin-login");
    }
  }, [navigate, director]);

  if (director !== "true") {
    return null;
  }

  const [admins, setAdmins] = useState([]);
  const [completed, setCompleted] = useState([]);

  const [showChangeModal, setShowChangeModal] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showDirectorPasswordModal, setShowDirectorPasswordModal] = useState(false);
  const [showClearModal, setShowClearModal] = useState(false);

  const [selectedEmail, setSelectedEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newAdminEmail, setNewAdminEmail] = useState("");
  const [newAdminPassword, setNewAdminPassword] = useState("");
  const [directorNewPassword, setDirectorNewPassword] = useState("");
  const [directorPasswordError, setDirectorPasswordError] = useState("");

  const [expandedTickets, setExpandedTickets] = useState({});

  const toggleExpand = (id) => {
    setExpandedTickets(prev => ({ ...prev, [id]: !prev[id] }));
  };

  async function loadAdmins() {
    const res = await fetch("http://localhost:5000/api/admin/all");
    const data = await res.json();
    if (data.success) setAdmins(data.admins);
  }

  async function loadCompleted() {
    const res = await fetch("http://localhost:5000/api/tickets/completed");
    const data = await res.json();
    if (data.success) setCompleted(data.tickets);
  }

  useEffect(() => {
    loadAdmins();
    loadCompleted();
  }, []);

  async function changePassword() {
    const res = await fetch("http://localhost:5000/api/admin/update-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: selectedEmail, newPassword }),
    });
    const data = await res.json();
    if (data.success) {
      setShowChangeModal(false);
      setNewPassword("");
      loadAdmins();
    }
  }

  async function addAdmin() {
    const res = await fetch("http://localhost:5000/api/admin/create", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: newAdminEmail, password: newAdminPassword }),
    });
    const data = await res.json();
    if (data.success) {
      setShowAddModal(false);
      setNewAdminEmail("");
      setNewAdminPassword("");
      loadAdmins();
    }
  }

  async function deleteAdmin() {
    const res = await fetch("http://localhost:5000/api/admin/delete", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: selectedEmail }),
    });
    const data = await res.json();
    if (data.success) {
      setShowDeleteModal(false);
      loadAdmins();
    }
  }

  async function clearCompletedTickets() {
    const res = await fetch("http://localhost:5000/api/tickets/completed/clear", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
    });
    const data = await res.json();
    if (data.success) {
      setShowClearModal(false);
      loadCompleted();
    }
  }

  async function restoreTicket(id) {
    const res = await fetch(`http://localhost:5000/api/tickets/completed/restore/${id}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
    });
    const data = await res.json();
    if (data.success) {
      loadCompleted();
      alert("Заявка возвращена в активные");
    }
  }

  async function changeDirectorPassword() {
    setDirectorPasswordError("");
    const res = await fetch("http://localhost:5000/api/director/update-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ newPassword: directorNewPassword }),
    });
    const data = await res.json();
    if (!data.success) {
      setDirectorPasswordError("Ошибка смены пароля");
      return;
    }
    localStorage.removeItem("director");
    navigate("/admin-login");
  }

  function logoutDirector() {
    localStorage.removeItem("director");
    navigate("/admin-login");
  }

  const truncateText = (text, maxLength = 100) => {
    if (text.length <= maxLength) return text;
    return text.slice(0, maxLength) + "...";
  };

  return (
    <div style={container}>
      <h1 style={title}>Панель директора</h1>

      <div style={twoColumns}>
        {/* Левая колонка: управление администраторами */}
        <div style={leftColumn}>
          <h2 style={subtitle}>Администраторы</h2>
          {admins.map((admin) => (
            <div key={admin.id} style={card}>
              <p style={cardText}><b>Email:</b> {admin.email}</p>
              <div style={cardActions}>
                <button
                  onClick={() => {
                    setSelectedEmail(admin.email);
                    setShowChangeModal(true);
                  }}
                  style={buttonSecondary}
                >
                  Изменить пароль
                </button>
                <button
                  onClick={() => {
                    setSelectedEmail(admin.email);
                    setShowDeleteModal(true);
                  }}
                  style={{ ...buttonSecondary, backgroundColor: "#b91c1c" }}
                >
                  Удалить
                </button>
              </div>
            </div>
          ))}

          <div style={buttonGroup}>
            <button onClick={() => setShowAddModal(true)} style={buttonPrimary}>
              Добавить администратора
            </button>
            <button onClick={() => setShowDirectorPasswordModal(true)} style={buttonSecondary}>
              Сменить пароль директора
            </button>
            <button onClick={() => setShowClearModal(true)} style={{ ...buttonSecondary, backgroundColor: "#b91c1c" }}>
              Очистить закрытые заявки
            </button>
            <button onClick={logoutDirector} style={buttonSecondary}>
              Выйти
            </button>
          </div>
        </div>

        {/* Правая колонка: закрытые заявки */}
        <div style={rightColumn}>
          <h2 style={subtitle}>Закрытые заявки</h2>
          <div style={ticketsList}>
            {completed.length === 0 ? (
              <p style={emptyMessage}>Нет закрытых заявок</p>
            ) : (
              completed.map((ticket) => {
                const isExpanded = expandedTickets[ticket.id];
                const message = ticket.message || "";
                const displayMessage = isExpanded ? message : truncateText(message);
                const needToggle = message.length > 100;

                return (
                  <div key={ticket.id} style={card}>
                    <p style={cardText}><b>Email:</b> {ticket.email}</p>
                    <p style={cardText}><b>Телефон:</b> {ticket.phone}</p>
                    <p style={cardText}>
                      <b>Сообщение:</b> {displayMessage}
                      {needToggle && (
                        <button
                          onClick={() => toggleExpand(ticket.id)}
                          style={toggleButton}
                        >
                          {isExpanded ? "Свернуть" : "Показать полностью"}
                        </button>
                      )}
                    </p>
                    <p style={cardText}><b>Закрыто админом:</b> {ticket.admin_email}</p>
                    <button
                      onClick={() => restoreTicket(ticket.id)}
                      style={buttonPrimary}
                    >
                      Вернуть в активные
                    </button>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* Модалки (без изменений) */}
      {showAddModal && (
        <Modal>
          <h3 style={modalTitle}>Добавить администратора</h3>
          <input
            type="email"
            placeholder="Email"
            value={newAdminEmail}
            onChange={(e) => setNewAdminEmail(e.target.value)}
            style={input}
          />
          <input
            type="password"
            placeholder="Пароль"
            value={newAdminPassword}
            onChange={(e) => setNewAdminPassword(e.target.value)}
            style={input}
          />
          <button onClick={addAdmin} style={modalButtonPrimary}>Добавить</button>
          <button onClick={() => setShowAddModal(false)} style={modalButtonSecondary}>Отмена</button>
        </Modal>
      )}

      {showChangeModal && (
        <Modal>
          <h3 style={modalTitle}>Изменить пароль</h3>
          <input
            type="password"
            placeholder="Новый пароль"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            style={input}
          />
          <button onClick={changePassword} style={modalButtonPrimary}>Изменить</button>
          <button onClick={() => setShowChangeModal(false)} style={modalButtonSecondary}>Отмена</button>
        </Modal>
      )}

      {showDeleteModal && (
        <Modal>
          <h3 style={modalTitle}>Удалить администратора?</h3>
          <p style={modalText}>{selectedEmail}</p>
          <button onClick={deleteAdmin} style={modalButtonPrimary}>Удалить</button>
          <button onClick={() => setShowDeleteModal(false)} style={modalButtonSecondary}>Отмена</button>
        </Modal>
      )}

      {showClearModal && (
        <Modal>
          <h3 style={modalTitle}>Очистить все закрытые заявки?</h3>
          <p style={modalText}>Это действие необратимо.</p>
          <button onClick={clearCompletedTickets} style={modalButtonPrimary}>Очистить</button>
          <button onClick={() => setShowClearModal(false)} style={modalButtonSecondary}>Отмена</button>
        </Modal>
      )}

      {showDirectorPasswordModal && (
        <Modal>
          <h3 style={modalTitle}>Сменить пароль директора</h3>
          <input
            type="password"
            placeholder="Новый пароль директора"
            value={directorNewPassword}
            onChange={(e) => setDirectorNewPassword(e.target.value)}
            style={input}
          />
          {directorPasswordError && <p style={{ color: "#ef4444", marginTop: 10 }}>{directorPasswordError}</p>}
          <button onClick={changeDirectorPassword} style={modalButtonPrimary}>Сменить</button>
          <button onClick={() => setShowDirectorPasswordModal(false)} style={modalButtonSecondary}>Отмена</button>
        </Modal>
      )}
    </div>
  );
}

// Модальное окно (без изменений)
function Modal({ children }) {
  return (
    <div style={modalBg}>
      <div style={modalBox}>{children}</div>
    </div>
  );
}

// Стили (тёмная тема + двухколоночный макет)
const container = {
  padding: 40,
  backgroundColor: "#0a0a0a",
  color: "#e0e0e0",
  fontFamily: "system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif",
  minHeight: "100vh",
};

const title = {
  fontSize: "2rem",
  marginBottom: "1.5rem",
  borderBottom: "2px solid #333",
  display: "inline-block",
  paddingBottom: 8,
  color: "#ffffff",
};

const twoColumns = {
  display: "flex",
  gap: "2rem",
  flexWrap: "wrap",
  alignItems: "flex-start",
};

const leftColumn = {
  flex: "1",
  minWidth: "300px",
};

const rightColumn = {
  flex: "1.5",
  minWidth: "350px",
};

const ticketsList = {
  maxHeight: "calc(100vh - 180px)",
  overflowY: "auto",
  paddingRight: "8px",
};

const subtitle = {
  fontSize: "1.5rem",
  margin: "0 0 1rem 0",
  color: "#dddddd",
};

const card = {
  border: "1px solid #2a2a2a",
  padding: 16,
  marginBottom: 16,
  borderRadius: 8,
  backgroundColor: "#111111",
  boxShadow: "0 2px 4px rgba(0,0,0,0.3)",
};

const cardText = {
  margin: "8px 0",
  color: "#cccccc",
  lineHeight: 1.4,
  wordBreak: "break-word",
};

const cardActions = {
  display: "flex",
  gap: "10px",
  marginTop: 12,
};

const buttonGroup = {
  display: "flex",
  flexWrap: "wrap",
  gap: "12px",
  marginTop: 20,
};

const buttonPrimary = {
  padding: "10px 20px",
  backgroundColor: "#2c2c2c",
  color: "#ffffff",
  border: "1px solid #444",
  borderRadius: 6,
  cursor: "pointer",
  fontWeight: 500,
  transition: "background-color 0.2s",
};

const buttonSecondary = {
  padding: "10px 20px",
  backgroundColor: "#1f1f1f",
  color: "#e0e0e0",
  border: "1px solid #333",
  borderRadius: 6,
  cursor: "pointer",
  fontWeight: 500,
  transition: "background-color 0.2s",
};

const toggleButton = {
  background: "none",
  border: "none",
  color: "#9ca3af",
  cursor: "pointer",
  marginLeft: 8,
  fontSize: "0.9rem",
  textDecoration: "underline",
};

const emptyMessage = {
  color: "#888",
  textAlign: "center",
  padding: "2rem",
};

// Модальные окна (оставлены тёмными)
const modalBg = {
  position: "fixed",
  top: 0,
  left: 0,
  width: "100%",
  height: "100%",
  backgroundColor: "rgba(0,0,0,0.85)",
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  zIndex: 9999,
};

const modalBox = {
  backgroundColor: "#1a1a1a",
  padding: 30,
  borderRadius: 12,
  width: 400,
  maxWidth: "90%",
  boxShadow: "0 10px 25px rgba(0,0,0,0.5)",
  border: "1px solid #333",
};

const modalTitle = {
  marginTop: 0,
  marginBottom: 20,
  color: "#ffffff",
  fontSize: "1.5rem",
};

const modalText = {
  marginBottom: 20,
  color: "#cccccc",
};

const input = {
  width: "100%",
  padding: "10px 12px",
  marginBottom: 16,
  border: "1px solid #444",
  borderRadius: 6,
  fontSize: "1rem",
  boxSizing: "border-box",
  backgroundColor: "#2a2a2a",
  color: "#ffffff",
};

const modalButtonPrimary = {
  width: "100%",
  padding: "10px 15px",
  backgroundColor: "#2c2c2c",
  color: "#ffffff",
  border: "1px solid #555",
  borderRadius: 6,
  marginTop: 8,
  cursor: "pointer",
  fontWeight: 500,
};

const modalButtonSecondary = {
  width: "100%",
  padding: "10px 15px",
  backgroundColor: "#222",
  color: "#cccccc",
  border: "1px solid #444",
  borderRadius: 6,
  marginTop: 12,
  cursor: "pointer",
  fontWeight: 500,
};