import { useEffect, useState } from "react";

export default function AdminDashboard() {
  const [tickets, setTickets] = useState([]);
  const [completed, setCompleted] = useState([]);

  // Загружаем активные заявки
  async function loadTickets() {
    const res = await fetch("http://localhost:5000/api/tickets/all");
    const data = await res.json();
    if (data.success) setTickets(data.tickets);
  }

  // Загружаем закрытые заявки
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
    const adminEmail = localStorage.getItem("adminEmail") || "admin@gmail.com";

    const res = await fetch(`http://localhost:5000/api/tickets/close/${id}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ adminEmail }),
    });

    const data = await res.json();

    if (data.success) {
      // 1. Удаляем из активных
      setTickets((prev) => prev.filter((t) => t.id !== id));

      // 2. Перезагружаем закрытые заявки
      loadCompleted();
    }
  }

  return (
    <div style={{ padding: 40 }}>
      <h1>Активные заявки</h1>

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

      <h1>Закрытые заявки</h1>

      {completed.map((ticket) => (
        <div key={ticket.id} style={{ border: "1px solid #aaa", padding: 10, marginBottom: 10 }}>
          <p><b>Email:</b> {ticket.email}</p>
          <p><b>Телефон:</b> {ticket.phone}</p>
          <p><b>Сообщение:</b> {ticket.message}</p>
          <p><b>Закрыто администратором:</b> {ticket.admin_email}</p>
        </div>
      ))}
    </div>
  );
}
