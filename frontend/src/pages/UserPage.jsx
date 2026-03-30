import { useState } from "react";

export default function UserPage() {
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [message, setMessage] = useState("");
  const [success, setSuccess] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();

    const res = await fetch("http://localhost:5000/api/tickets/submit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, phone, message }),
    });

    const data = await res.json();

    if (data.success) {
      setSuccess("Заявка успешно отправлена!");
      setEmail("");
      setPhone("");
      setMessage("");
    }
  }

  return (
    <div style={{ padding: 40 }}>
      <h1>Оставить заявку</h1>

      <form onSubmit={handleSubmit}>
        <input
          type="email"
          placeholder="Ваш email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        /><br /><br />

        <input
          type="text"
          placeholder="Ваш номер телефона"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
        /><br /><br />

        <textarea
          placeholder="Ваше сообщение"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
        /><br /><br />

        <button type="submit">Отправить</button>

        {success && <p style={{ color: "green" }}>{success}</p>}
      </form>
    </div>
  );
}
