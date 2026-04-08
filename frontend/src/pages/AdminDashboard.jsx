import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import { apiFetch } from "../lib/api";
import { validateLoginForm } from "../utils/validation";

function TicketCard({ ticket, showClose, onClose, onStart }) {
  const [expanded, setExpanded] = useState(false);
  const statusLabel = ticket.status === "in_progress" ? "In Progress" : "Active";
  const statusColors = ticket.status === "in_progress" ? statusBadgeProgress : statusBadgeActive;

  return (
    <div style={cardStyle}>
      <div style={cardHeaderStyle}>
        <p><b>Email:</b> {ticket.email}</p>
        <span style={{ ...statusBadgeStyle, ...statusColors }}>{statusLabel}</span>
      </div>
      <p><b>Phone:</b> {ticket.phone}</p>
      {ticket.admin_email && <p><b>Assigned:</b> {ticket.admin_email}</p>}
      <div style={{ ...messageStyle, maxHeight: expanded ? "none" : 60 }}>
        <b>Message:</b> {ticket.message}
      </div>
      <div style={{ display: "flex", gap: 10 }}>
        <button onClick={() => setExpanded(!expanded)} style={smallButtonStyle}>
          {expanded ? "Collapse" : "Expand"}
        </button>
        <button onClick={() => navigator.clipboard.writeText(ticket.message)} style={smallButtonStyle}>
          Copy
        </button>
        {showClose && ticket.status !== "in_progress" && (
          <button onClick={onStart} style={smallButtonStyle}>
            Start
          </button>
        )}
        {showClose && (
          <button onClick={onClose} style={{ ...smallButtonStyle, marginLeft: "auto", background: "#d00000" }}>
            Close
          </button>
        )}
      </div>
    </div>
  );
}

function PaginationControls({ page, totalPages, onChange }) {
  return (
    <div style={paginationStyle}>
      <button onClick={() => onChange(page - 1)} disabled={page <= 1} style={smallButtonStyle}>
        Prev
      </button>
      <span style={{ color: "#bbb" }}>Page {page} / {totalPages}</span>
      <button onClick={() => onChange(page + 1)} disabled={page >= totalPages} style={smallButtonStyle}>
        Next
      </button>
    </div>
  );
}

function getErrorMessage(error) {
  const validationError = error?.data?.errors?.[0]?.message;
  return validationError || error?.message || "Request failed";
}

export default function AdminDashboard() {
  const navigate = useNavigate();
  const { user, logout, refreshAuth } = useAuth();
  const [tickets, setTickets] = useState([]);
  const [completed, setCompleted] = useState([]);
  const [activeMeta, setActiveMeta] = useState({ page: 1, totalPages: 1 });
  const [completedMeta, setCompletedMeta] = useState({ page: 1, totalPages: 1 });
  const [activeEmailFilter, setActiveEmailFilter] = useState("");
  const [activeStatusFilter, setActiveStatusFilter] = useState("");
  const [completedEmailFilter, setCompletedEmailFilter] = useState("");
  const [showDirectorModal, setShowDirectorModal] = useState(false);
  const [directorEmail, setDirectorEmail] = useState("");
  const [directorPassword, setDirectorPassword] = useState("");
  const [directorError, setDirectorError] = useState("");

  useEffect(() => {
    loadTickets(1, activeEmailFilter, activeStatusFilter);
  }, [activeEmailFilter, activeStatusFilter]);

  useEffect(() => {
    loadCompleted(1, completedEmailFilter);
  }, [completedEmailFilter]);

  async function loadTickets(page = activeMeta.page, email = activeEmailFilter, status = activeStatusFilter) {
    const params = new URLSearchParams({
      page: String(page),
      pageSize: "8",
    });

    if (email.trim()) {
      params.set("email", email.trim());
    }

    if (status.trim()) {
      params.set("status", status.trim());
    }

    const data = await apiFetch(`/api/tickets/all?${params.toString()}`);
    setTickets(data.items || []);
    setActiveMeta({
      page: data.page || 1,
      totalPages: data.totalPages || 1,
    });
  }

  async function loadCompleted(page = completedMeta.page, email = completedEmailFilter) {
    const params = new URLSearchParams({
      page: String(page),
      pageSize: "6",
    });

    if (email.trim()) {
      params.set("email", email.trim());
    }

    const data = await apiFetch(`/api/tickets/completed?${params.toString()}`);
    setCompleted(data.items || []);
    setCompletedMeta({
      page: data.page || 1,
      totalPages: data.totalPages || 1,
    });
  }

  async function startTicket(id) {
    const data = await apiFetch(`/api/tickets/start/${id}`, {
      method: "POST",
      body: {},
    });

    if (data.success) {
      await loadTickets(activeMeta.page, activeEmailFilter, activeStatusFilter);
    }
  }

  async function closeTicket(id) {
    const data = await apiFetch(`/api/tickets/close/${id}`, {
      method: "POST",
      body: {},
    });

    if (data.success) {
      await Promise.all([
        loadTickets(activeMeta.page, activeEmailFilter, activeStatusFilter),
        loadCompleted(1, completedEmailFilter),
      ]);
    }
  }

  async function handleDirectorLogin() {
    setDirectorError("");
    const validationError = validateLoginForm({ email: directorEmail, password: directorPassword });

    if (validationError) {
      setDirectorError(validationError);
      return;
    }

    try {
      await apiFetch("/api/auth/login/director", {
        method: "POST",
        body: { email: directorEmail.trim(), password: directorPassword },
        skipRefresh: true,
      });
      await refreshAuth();
      setShowDirectorModal(false);
      navigate("/director-dashboard");
    } catch (error) {
      setDirectorError(getErrorMessage(error));
    }
  }

  async function handleLogout() {
    await logout();
    navigate("/admin-login");
  }

  return (
    <div style={pageStyle}>
      <div style={sidebarStyle}>
        <h2 style={accentTitleStyle}>Completed Tickets</h2>
        <input
          placeholder="Filter by email"
          value={completedEmailFilter}
          onChange={(e) => setCompletedEmailFilter(e.target.value)}
          style={inputStyle}
        />
        {completed.length === 0 && <p>No completed tickets yet</p>}
        {completed.map((ticket) => (
          <TicketCard key={ticket.id} ticket={ticket} showClose={false} />
        ))}
        <PaginationControls
          page={completedMeta.page}
          totalPages={completedMeta.totalPages}
          onChange={(page) => loadCompleted(page, completedEmailFilter)}
        />
      </div>

      <div style={mainStyle}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 20, gap: 12, flexWrap: "wrap" }}>
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap", flex: 1 }}>
            <input
              placeholder="Filter active by email"
              value={activeEmailFilter}
              onChange={(e) => setActiveEmailFilter(e.target.value)}
              style={{ ...inputStyle, maxWidth: 280, marginBottom: 0 }}
            />
            <select
              value={activeStatusFilter}
              onChange={(e) => setActiveStatusFilter(e.target.value)}
              style={{ ...inputStyle, maxWidth: 180, marginBottom: 0 }}
            >
              <option value="">All statuses</option>
              <option value="active">active</option>
              <option value="in_progress">in_progress</option>
            </select>
          </div>
          <button onClick={() => setShowDirectorModal(true)} style={smallButtonStyle}>
            Director Login
          </button>
        </div>

        <h1 style={accentTitleStyle}>Admin Dashboard</h1>
        <p style={{ marginBottom: 20, fontSize: 18 }}><b>Signed in as:</b> {user?.email}</p>
        <button onClick={handleLogout} style={logoutButtonStyle}>Logout</button>

        <h2 style={accentTitleStyle}>Active Tickets</h2>
        {tickets.length === 0 && <p>No active tickets</p>}
        {tickets.map((ticket) => (
          <TicketCard
            key={ticket.id}
            ticket={ticket}
            showClose
            onStart={() => startTicket(ticket.id)}
            onClose={() => closeTicket(ticket.id)}
          />
        ))}
        <PaginationControls
          page={activeMeta.page}
          totalPages={activeMeta.totalPages}
          onChange={(page) => loadTickets(page, activeEmailFilter, activeStatusFilter)}
        />
      </div>

      {showDirectorModal && (
        <div style={modalBgStyle}>
          <div style={modalBoxStyle}>
            <h3 style={accentTitleStyle}>Director Session</h3>
            <input
              type="email"
              placeholder="Director email"
              value={directorEmail}
              onChange={(e) => setDirectorEmail(e.target.value)}
              style={inputStyle}
            />
            <input
              type="password"
              placeholder="Director password"
              value={directorPassword}
              onChange={(e) => setDirectorPassword(e.target.value)}
              style={inputStyle}
            />
            {directorError && <p style={{ color: "#ff6b6b" }}>{directorError}</p>}
            <div style={{ display: "flex", gap: 10 }}>
              <button onClick={handleDirectorLogin} style={logoutButtonStyle}>Sign In</button>
              <button onClick={() => setShowDirectorModal(false)} style={smallButtonStyle}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const pageStyle = {
  display: "flex",
  background: "#0f0f0f",
  minHeight: "100vh",
  color: "white",
  fontFamily: "Poppins, sans-serif",
};

const sidebarStyle = {
  width: "30%",
  background: "#111",
  padding: 20,
  borderRight: "2px solid #222",
  boxShadow: "4px 0 12px rgba(0,0,0,0.4)",
};

const mainStyle = { flex: 1, padding: 40 };

const cardStyle = {
  background: "#1a1a1a",
  padding: 15,
  borderRadius: 10,
  marginBottom: 15,
  color: "white",
  boxShadow: "0 4px 12px rgba(0,0,0,0.4)",
  border: "1px solid #333",
};

const cardHeaderStyle = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: 12,
};

const messageStyle = {
  overflow: "hidden",
  whiteSpace: "pre-wrap",
  wordBreak: "break-word",
  marginBottom: 10,
};

const statusBadgeStyle = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  padding: "4px 10px",
  borderRadius: 999,
  fontSize: 12,
  fontWeight: 700,
  textTransform: "uppercase",
  letterSpacing: "0.08em",
};

const statusBadgeActive = {
  background: "#1f2937",
  color: "#d1d5db",
};

const statusBadgeProgress = {
  background: "#7c2d12",
  color: "#fdba74",
};

const smallButtonStyle = {
  padding: "6px 10px",
  background: "#444",
  borderRadius: 6,
  cursor: "pointer",
  border: "none",
  color: "white",
};

const logoutButtonStyle = {
  padding: "10px 20px",
  background: "#d00000",
  color: "white",
  borderRadius: 8,
  cursor: "pointer",
  border: "none",
  marginBottom: 30,
};

const paginationStyle = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: 10,
  marginTop: 12,
};

const accentTitleStyle = { color: "#d00000" };

const modalBgStyle = {
  position: "fixed",
  top: 0,
  left: 0,
  width: "100%",
  height: "100%",
  background: "rgba(0,0,0,0.7)",
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
};

const modalBoxStyle = {
  background: "#1a1a1a",
  padding: 30,
  borderRadius: 12,
  width: 350,
  color: "white",
  boxShadow: "0 4px 15px rgba(0,0,0,0.5)",
  border: "1px solid #333",
};

const inputStyle = {
  width: "100%",
  padding: 12,
  marginTop: 10,
  borderRadius: 8,
  border: "1px solid #333",
  background: "#111",
  color: "white",
  marginBottom: 10,
};
