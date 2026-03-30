import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

export default function DirectorDashboard() {
  const navigate = useNavigate();

  const [admins, setAdmins] = useState([]);
  const [completed, setCompleted] = useState([]);

  // Модалки
  const [showChangeModal, setShowChangeModal] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showDirectorPasswordModal, setShowDirectorPasswordModal] = useState(false);
  const [showClearModal, setShowClearModal] = useState(false);

  // Данные для модалок
  const [selectedEmail, setSelectedEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newAdminEmail, setNewAdminEmail] = useState("");
  const [newAdminPassword, setNewAdminPassword] = useState("");
  const [directorNewPassword, setDirectorNewPassword] = useState("");
  const [directorPasswordError, setDirectorPasswordError] = useState("");

  // Защита панели директора
  useEffect(() => {
    if (!localStorage.getItem("director")) {
      navigate("/admin-login");
    }
  }, [navigate]);

  // Загрузка админов
  async function loadAdmins() {
    const res = await fetch("http://localhost:5000/api/admin/all");
    const data = await res.json();
    if (data.success) setAdmins(data.admins);
  }

  // Загрузка закрытых заявок
  async function loadCompleted() {
    const res = await fetch("http://localhost:5000/api/tickets/completed");
    const data = await res.json();
    if (data.success) setCompleted(data.tickets);
  }

  useEffect(() => {
    loadAdmins();
    loadCompleted();
  }, []);

  // Смена пароля админа
  async function changePassword() {
    const res = await fetch("http://localhost:5000/api/admin/update-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: selectedEmail,
        newPassword,
      }),
    });

    const data = await res.json();

    if (data.success) {
      setShowChangeModal(false);
      setNewPassword("");
      loadAdmins();
    }
  }

  // Добавление нового админа
  async function addAdmin() {
    const res = await fetch("http://localhost:5000/api/admin/create", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: newAdminEmail,
        password: newAdminPassword,
      }),
    });

    const data = await res.json();

    if (data.success) {
      setShowAddModal(false);
      setNewAdminEmail("");
      setNewAdminPassword("");
      loadAdmins();
    }
  }

  // Удаление админа
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

  // Очистка закрытых заявок
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

  // Вернуть закрытую заявку обратно в активные
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

  // Смена пароля директора
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

  // Выход директора
  function logoutDirector() {
    localStorage.removeItem("director");
    navigate("/admin-login");
  }

  return (
    <div style={{ padding: 40, position: "relative" }}>
      <h1>Панель директора</h1>

      <h2>Администраторы</h2>

      {admins.map((admin) => (
        <div
          key={admin.id}
          style={{
            border: "1px solid #ccc",
            padding: 10,
            marginBottom: 10,
            borderRadius: 6,
          }}
        >
          <p><b>Email:</b> {admin.email}</p>

          <button
            onClick={() => {
              setSelectedEmail(admin.email);
              setShowChangeModal(true);
            }}
            style={{
              padding: "6px 12px",
              background: "#444",
              color: "white",
              borderRadius: 6,
              cursor: "pointer",
              marginRight: 10
            }}
          >
            Изменить пароль
          </button>

          <button
            onClick={() => {
              setSelectedEmail(admin.email);
              setShowDeleteModal(true);
            }}
            style={{
              padding: "6px 12px",
              background: "#b22",
              color: "white",
              borderRadius: 6,
              cursor: "pointer",
            }}
          >
            Удалить
          </button>
        </div>
      ))}

      <button
        onClick={() => setShowAddModal(true)}
        style={{
          padding: "10px 20px",
          background: "#2a7",
          color: "white",
          borderRadius: 8,
          cursor: "pointer",
          marginTop: 20,
        }}
      >
        Добавить администратора
      </button>

      <button
        onClick={() => setShowDirectorPasswordModal(true)}
        style={{
          padding: "10px 20px",
          background: "#555",
          color: "white",
          borderRadius: 8,
          cursor: "pointer",
          marginTop: 20,
          marginLeft: 20,
        }}
      >
        Сменить пароль директора
      </button>

      <button
        onClick={() => setShowClearModal(true)}
        style={{
          padding: "10px 20px",
          background: "#b22",
          color: "white",
          borderRadius: 8,
          cursor: "pointer",
          marginTop: 20,
          marginLeft: 20,
        }}
      >
        Очистить закрытые заявки
      </button>

      <button
        onClick={logoutDirector}
        style={{
          padding: "10px 20px",
          background: "#333",
          color: "white",
          borderRadius: 8,
          cursor: "pointer",
          marginTop: 20,
          marginLeft: 20,
        }}
      >
        Выйти
      </button>

      {/* Закрытые заявки */}
      <h2 style={{ marginTop: 40 }}>Закрытые заявки</h2>

      {completed.map((ticket) => (
        <div
          key={ticket.id}
          style={{
            border: "1px solid #aaa",
            padding: 10,
            marginBottom: 10,
            borderRadius: 6,
          }}
        >
          <p><b>Email:</b> {ticket.email}</p>
          <p><b>Телефон:</b> {ticket.phone}</p>
          <p><b>Сообщение:</b> {ticket.message}</p>
          <p><b>Закрыто админом:</b> {ticket.admin_email}</p>

          <button
            onClick={() => restoreTicket(ticket.id)}
            style={{
              padding: "6px 12px",
              background: "#2a7",
              color: "white",
              borderRadius: 6,
              cursor: "pointer",
              marginTop: 10
            }}
          >
            Вернуть в активные
          </button>
        </div>
      ))}

      {/* Модалка добавления админа */}
      {showAddModal && (
        <div style={modalBg}>
          <div style={modalBox}>
            <h3>Добавить администратора</h3>

            <input
              type="email"
              placeholder="Email"
              value={newAdminEmail}
              onChange={(e) => setNewAdminEmail(e.target.value)}
              style={{ width: "100%", marginBottom: 10 }}
            />

            <input
              type="password"
              placeholder="Пароль"
              value={newAdminPassword}
              onChange={(e) => setNewAdminPassword(e.target.value)}
              style={{ width: "100%", marginBottom: 10 }}
            />

            <button onClick={addAdmin} style={btnPrimary}>
              Добавить
            </button>

            <button onClick={() => setShowAddModal(false)} style={btnSecondary}>
              Отмена
            </button>
          </div>
        </div>
      )}

      {/* Модалка смены пароля админа */}
      {showChangeModal && (
        <div style={modalBg}>
          <div style={modalBox}>
            <h3>Изменить пароль</h3>

            <input
              type="password"
              placeholder="Новый пароль"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              style={{ width: "100%", marginBottom: 10 }}
            />

            <button onClick={changePassword} style={btnPrimary}>
              Изменить
            </button>

            <button onClick={() => setShowChangeModal(false)} style={btnSecondary}>
              Отмена
            </button>
          </div>
        </div>
      )}

      {/* Модалка удаления админа */}
      {showDeleteModal && (
        <div style={modalBg}>
          <div style={modalBox}>
            <h3>Удалить администратора?</h3>
            <p>{selectedEmail}</p>

            <button onClick={deleteAdmin} style={btnPrimary}>
              Удалить
            </button>

            <button onClick={() => setShowDeleteModal(false)} style={btnSecondary}>
              Отмена
            </button>
          </div>
        </div>
      )}

      {/* Модалка очистки закрытых заявок */}
      {showClearModal && (
        <div style={modalBg}>
          <div style={modalBox}>
            <h3>Очистить все закрытые заявки?</h3>
            <p>Это действие необратимо.</p>

            <button onClick={clearCompletedTickets} style={btnPrimary}>
              Очистить
            </button>

            <button onClick={() => setShowClearModal(false)} style={btnSecondary}>
              Отмена
            </button>
          </div>
        </div>
      )}

      {/* Модалка смены пароля директора */}
      {showDirectorPasswordModal && (
        <div style={modalBg}>
          <div style={modalBox}>
            <h3>Сменить пароль директора</h3>

            <input
              type="password"
              placeholder="Новый пароль директора"
              value={directorNewPassword}
              onChange={(e) => setDirectorNewPassword(e.target.value)}
              style={{ width: "100%", marginBottom: 10 }}
            />

            {directorPasswordError && (
              <p style={{ color: "red" }}>{directorPasswordError}</p>
            )}

            <button onClick={changeDirectorPassword} style={btnPrimary}>
              Сменить
            </button>

            <button onClick={() => setShowDirectorPasswordModal(false)} style={btnSecondary}>
              Отмена
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// Стили модалок
const modalBg = {
  position: "fixed",
  top: 0,
  left: 0,
  width: "100%",
  height: "100%",
  background: "rgba(0,0,0,0.5)",
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  zIndex: 9999,
};

const modalBox = {
  background: "white",
  padding: 30,
  borderRadius: 10,
  width: 350,
  zIndex: 10000,
};

const btnPrimary = {
  width: "100%",
  padding: "10px 15px",
  background: "#b22",
  color: "white",
  borderRadius: 6,
  marginTop: 15,
  cursor: "pointer",
};

const btnSecondary = {
  width: "100%",
  padding: "10px 15px",
  background: "#aaa",
  color: "white",
  borderRadius: 6,
  marginTop: 10,
  cursor: "pointer",
};
