import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

export default function DirectorDashboard() {
  const navigate = useNavigate();

  const [admins, setAdmins] = useState([]);

  // Модалки
  const [showChangeModal, setShowChangeModal] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showDirectorPasswordModal, setShowDirectorPasswordModal] = useState(false);

  // Данные для модалок
  const [selectedEmail, setSelectedEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newAdminEmail, setNewAdminEmail] = useState("");
  const [newAdminPassword, setNewAdminPassword] = useState("");
  const [directorNewPassword, setDirectorNewPassword] = useState("");
  const [directorPasswordError, setDirectorPasswordError] = useState("");

  // 🔥 Защита панели директора
  useEffect(() => {
    if (!localStorage.getItem("director")) {
      navigate("/");
    }
  }, [navigate]);

  // Загрузка админов
  async function loadAdmins() {
    const res = await fetch("http://localhost:5000/api/admin/all");
    const data = await res.json();
    if (data.success) setAdmins(data.admins);
  }

  useEffect(() => {
    loadAdmins();
  }, []);

  // 🔥 Смена пароля админа
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
      if (selectedEmail === localStorage.getItem("adminEmail")) {
        localStorage.removeItem("adminEmail");
      }

      setShowChangeModal(false);
      setNewPassword("");
      loadAdmins();
    }
  }

  // 🔥 Добавление нового админа
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

  // 🔥 Смена пароля директора
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

    // После смены пароля директор выходит
    localStorage.removeItem("director");
    navigate("/");
  }

  // Выход директора
  function logoutDirector() {
    localStorage.removeItem("director");
    navigate("/admin-login");
  }

  return (
    <div style={{ padding: 40 }}>
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
            }}
          >
            Изменить пароль
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

      {/* Модалка смены пароля админа */}
      {showChangeModal && (
        <div style={modalBg}>
          <div style={modalBox}>
            <h3>Сменить пароль: {selectedEmail}</h3>

            <input
              type="password"
              placeholder="Новый пароль"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              style={inputStyle}
            />

            <button onClick={changePassword} style={btnPrimary}>
              Сохранить
            </button>

            <button onClick={() => setShowChangeModal(false)} style={btnSecondary}>
              Отмена
            </button>
          </div>
        </div>
      )}

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
              style={inputStyle}
            />

            <input
              type="password"
              placeholder="Пароль"
              value={newAdminPassword}
              onChange={(e) => setNewAdminPassword(e.target.value)}
              style={inputStyle}
            />

            <button onClick={addAdmin} style={btnPrimary}>
              Создать
            </button>

            <button onClick={() => setShowAddModal(false)} style={btnSecondary}>
              Отмена
            </button>
          </div>
        </div>
      )}

      {/* Модалка смены пароля директора */}
      {showDirectorPasswordModal && (
        <div style={modalBg}>
          <div style={modalBox}>
            <h3>Новый пароль директора</h3>

            <input
              type="password"
              placeholder="Новый пароль"
              value={directorNewPassword}
              onChange={(e) => setDirectorNewPassword(e.target.value)}
              style={inputStyle}
            />

            {directorPasswordError && (
              <p style={{ color: "red" }}>{directorPasswordError}</p>
            )}

            <button onClick={changeDirectorPassword} style={btnPrimary}>
              Сохранить
            </button>

            <button
              onClick={() => setShowDirectorPasswordModal(false)}
              style={btnSecondary}
            >
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
};

const modalBox = {
  background: "white",
  padding: 30,
  borderRadius: 10,
  width: 350,
};

const inputStyle = {
  width: "100%",
  padding: 10,
  marginTop: 10,
  borderRadius: 6,
  border: "1px solid #ccc",
};

const btnPrimary = {
  width: "100%",
  padding: "10px 15px",
  background: "#333",
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
