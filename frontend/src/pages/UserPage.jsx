import { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function UserPage() {
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [message, setMessage] = useState("");
  const [success, setSuccess] = useState("");

  const navigate = useNavigate();

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
    <div
      style={{
        padding: 40,
        maxWidth: 500,
        margin: "0 auto",
        fontFamily: "Poppins, sans-serif",
        background: "#0f0f0f",
        minHeight: "100vh",
        color: "white"
      }}
    >
      {/* Шапка */}
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
          boxShadow: "0 0 25px rgba(255,0,0,0.25)",
          border: "1px solid #333",
          fontFamily: "Oswald, sans-serif",
          letterSpacing: "2px",
          textTransform: "uppercase"
        }}
      >
        HelpDesk Portal
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
        Оставить заявку
      </h2>

      <form
        onSubmit={handleSubmit}
        style={{
          background: "#1a1a1a",
          padding: 25,
          borderRadius: 12,
          boxShadow: "0 4px 15px rgba(0,0,0,0.5)",
          border: "1px solid #333"
        }}
      >
        {/* Email */}
        <label style={{ fontWeight: 600 }}>Email</label>
        <input
          type="text"
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

        {/* Телефон */}
        <label style={{ fontWeight: 600 }}>Телефон</label>
        <input
          type="text"
          maxLength={20}
          placeholder="Введите телефон (до 20 символов)"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
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

        {/* Сообщение */}
        <label style={{ fontWeight: 600 }}>Сообщение</label>
        <textarea
          maxLength={1000}
          placeholder="Введите сообщение (до 1000 символов)"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          style={{
            width: "100%",
            padding: 12,
            marginTop: 6,
            height: 140,
            borderRadius: 8,
            border: "1px solid #333",
            background: "#111",
            color: "white",
            fontSize: 16,
            resize: "none"
          }}
        />

        {/* Кнопка отправки */}
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
            marginTop: 10
          }}
        >
          Отправить
        </button>

        {success && (
          <p
            style={{
              color: "#4ade80",
              marginTop: 15,
              fontWeight: "bold",
              fontSize: 14
            }}
          >
            {success}
          </p>
        )}

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
          ← Назад
        </button>
      </form>
    </div>
  );
}
