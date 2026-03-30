import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [tickets, setTickets] = useState([]);

  useEffect(() => {
    // Проверка авторизации
    if (!localStorage.getItem("admin")) {
      navigate("/admin-login");
      return;
    }

    // Загрузка заявок
    async function loadTickets() {
      const res = await fetch("http://localhost:5000/api/tickets/all");
      const data = await res.json();

      if (data.success) {
        setTickets(data.tickets);
      }
    }

    loadTickets();
  }, []);

  return (
    <div style={{ padding: 40 }}>
      <h1>Admin Dashboard</h1>
      <h2>Все заявки</h2>

      {tickets.length === 0 && <p>Заявок пока нет.</p>}

      {tickets.map((t) => (
        <div
          key={t.id}
          style={{
            border: "1px solid #ccc",
            padding: 15,
            marginBottom: 10,
            borderRadius: 8,
          }}
        >
          <p><strong>Email:</strong> {t.email}</p>
          <p><strong>Телефон:</strong> {t.phone}</p>
          <p><strong>Сообщение:</strong> {t.message}</p>
          <p><strong>Дата:</strong> {new Date(t.created_at).toLocaleString()}</p>
          <p><strong>Статус:</strong> {t.status}</p>
        </div>
      ))}
    </div>
  );
}
