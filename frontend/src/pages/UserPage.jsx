import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { apiFetch } from "../lib/api";
import { validateTicketForm } from "../utils/validation";

function getErrorMessage(error) {
  const validationError = error?.data?.errors?.[0]?.message;
  return validationError || error?.message || "Request failed";
}

export default function UserPage() {
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [message, setMessage] = useState("");
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();
    setSuccess("");
    setError("");
    const validationError = validateTicketForm({ email, phone, message });

    if (validationError) {
      setError(validationError);
      return;
    }

    try {
      await apiFetch("/api/tickets/submit", {
        method: "POST",
        body: {
          email: email.trim(),
          phone: phone.trim(),
          message: message.trim(),
        },
        skipRefresh: true,
      });
      setSuccess("Ticket submitted successfully.");
      setEmail("");
      setPhone("");
      setMessage("");
    } catch (requestError) {
      setError(getErrorMessage(requestError));
    }
  }

  return (
    <div style={pageStyle}>
      <div style={brandStyle}>HelpDesk Portal</div>
      <h2 style={titleStyle}>Submit Ticket</h2>

      <form onSubmit={handleSubmit} style={formStyle}>
        <label style={labelStyle}>Email</label>
        <input
          type="email"
          maxLength={255}
          placeholder="Enter your email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          style={inputStyle}
        />

        <label style={labelStyle}>Phone</label>
        <input
          type="text"
          maxLength={30}
          placeholder="Enter your phone number"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          style={inputStyle}
        />

        <label style={labelStyle}>Message</label>
        <textarea
          maxLength={1000}
          placeholder="Describe the issue in at least 10 characters"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          style={textareaStyle}
        />

        <button type="submit" style={primaryButtonStyle}>
          Submit
        </button>

        {success && <p style={successStyle}>{success}</p>}
        {error && <p style={errorStyle}>{error}</p>}

        <button onClick={() => navigate("/")} type="button" style={secondaryButtonStyle}>
          Back
        </button>
      </form>
    </div>
  );
}

const pageStyle = {
  padding: 40,
  maxWidth: 500,
  margin: "0 auto",
  fontFamily: "Poppins, sans-serif",
  background: "#0f0f0f",
  minHeight: "100vh",
  color: "white",
};

const brandStyle = {
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
  textTransform: "uppercase",
};

const titleStyle = {
  textAlign: "center",
  marginBottom: 25,
  fontFamily: "Oswald, sans-serif",
  fontSize: 26,
  letterSpacing: "1px",
  color: "#d00000",
};

const formStyle = {
  background: "#1a1a1a",
  padding: 25,
  borderRadius: 12,
  boxShadow: "0 4px 15px rgba(0,0,0,0.5)",
  border: "1px solid #333",
};

const labelStyle = { fontWeight: 600 };

const inputStyle = {
  width: "100%",
  padding: 12,
  marginTop: 6,
  marginBottom: 18,
  borderRadius: 8,
  border: "1px solid #333",
  background: "#111",
  color: "white",
  fontSize: 16,
};

const textareaStyle = {
  width: "100%",
  padding: 12,
  marginTop: 6,
  height: 140,
  borderRadius: 8,
  border: "1px solid #333",
  background: "#111",
  color: "white",
  fontSize: 16,
  resize: "none",
};

const primaryButtonStyle = {
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
  marginTop: 10,
};

const secondaryButtonStyle = {
  width: "100%",
  padding: "10px 0",
  background: "#333",
  color: "white",
  borderRadius: 8,
  cursor: "pointer",
  border: "none",
  fontSize: 16,
  marginTop: 20,
  fontFamily: "Poppins, sans-serif",
};

const successStyle = {
  color: "#4ade80",
  marginTop: 15,
  fontWeight: "bold",
  fontSize: 14,
};

const errorStyle = {
  color: "#ff6b6b",
  marginTop: 15,
  fontWeight: "bold",
  fontSize: 14,
};
