import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import { apiFetch } from "../lib/api";
import {
  validateAdminMutationForm,
  validatePasswordForm,
} from "../utils/validation";

function getErrorMessage(error) {
  const validationError = error?.data?.errors?.[0]?.message;
  return validationError || error?.message || "Request failed";
}

function Modal({ children }) {
  return (
    <div style={modalBg}>
      <div style={modalBox}>{children}</div>
    </div>
  );
}

function formatDate(value) {
  if (!value) {
    return "-";
  }

  return new Date(value).toLocaleString();
}

function PaginationControls({ page, totalPages, onChange }) {
  return (
    <div style={paginationStyle}>
      <button onClick={() => onChange(page - 1)} disabled={page <= 1} style={buttonSecondary}>
        Prev
      </button>
      <span style={mutedText}>Page {page} / {totalPages}</span>
      <button onClick={() => onChange(page + 1)} disabled={page >= totalPages} style={buttonSecondary}>
        Next
      </button>
    </div>
  );
}

export default function DirectorDashboard() {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const [admins, setAdmins] = useState([]);
  const [completed, setCompleted] = useState([]);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [completedMeta, setCompletedMeta] = useState({ page: 1, totalPages: 1 });
  const [auditMeta, setAuditMeta] = useState({ page: 1, totalPages: 1 });
  const [completedEmailFilter, setCompletedEmailFilter] = useState("");
  const [auditEmailFilter, setAuditEmailFilter] = useState("");
  const [auditStatusFilter, setAuditStatusFilter] = useState("");
  const [error, setError] = useState("");
  const [selectedEmail, setSelectedEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newAdminEmail, setNewAdminEmail] = useState("");
  const [newAdminPassword, setNewAdminPassword] = useState("");
  const [directorNewPassword, setDirectorNewPassword] = useState("");
  const [expandedTickets, setExpandedTickets] = useState({});
  const [showChangeModal, setShowChangeModal] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showDirectorPasswordModal, setShowDirectorPasswordModal] = useState(false);
  const [showClearModal, setShowClearModal] = useState(false);

  useEffect(() => {
    refreshDashboard();

    const intervalId = window.setInterval(() => {
      Promise.all([
        loadOnlineUsers(),
        loadAuditLogs(auditMeta.page, auditEmailFilter, auditStatusFilter),
      ]).catch(() => {});
    }, 30_000);

    return () => window.clearInterval(intervalId);
  }, []);

  useEffect(() => {
    loadCompleted(1, completedEmailFilter);
  }, [completedEmailFilter]);

  useEffect(() => {
    loadAuditLogs(1, auditEmailFilter, auditStatusFilter);
  }, [auditEmailFilter, auditStatusFilter]);

  async function refreshDashboard() {
    await Promise.all([
      loadAdmins(),
      loadCompleted(1, completedEmailFilter),
      loadOnlineUsers(),
      loadAuditLogs(1, auditEmailFilter, auditStatusFilter),
    ]);
  }

  async function loadAdmins() {
    const data = await apiFetch("/api/admin/all");
    setAdmins(data.admins || []);
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

  async function loadOnlineUsers() {
    const data = await apiFetch("/api/director/online-users");
    setOnlineUsers(data.users || []);
  }

  async function loadAuditLogs(page = auditMeta.page, actorEmail = auditEmailFilter, status = auditStatusFilter) {
    const params = new URLSearchParams({
      page: String(page),
      pageSize: "8",
    });

    if (actorEmail.trim()) {
      params.set("actorEmail", actorEmail.trim());
    }

    if (status.trim()) {
      params.set("status", status.trim());
    }

    const data = await apiFetch(`/api/director/audit-logs?${params.toString()}`);
    setAuditLogs(data.items || []);
    setAuditMeta({
      page: data.page || 1,
      totalPages: data.totalPages || 1,
    });
  }

  async function addAdmin() {
    try {
      const validationError = validateAdminMutationForm({
        email: newAdminEmail,
        password: newAdminPassword,
      });

      if (validationError) {
        setError(validationError);
        return;
      }

      await apiFetch("/api/admin/create", {
        method: "POST",
        body: { email: newAdminEmail.trim(), password: newAdminPassword },
      });
      setShowAddModal(false);
      setNewAdminEmail("");
      setNewAdminPassword("");
      setError("");
      await refreshDashboard();
    } catch (requestError) {
      setError(getErrorMessage(requestError));
    }
  }

  async function changePassword() {
    try {
      const validationError = validatePasswordForm(newPassword, "New password");

      if (validationError) {
        setError(validationError);
        return;
      }

      await apiFetch("/api/admin/update-password", {
        method: "POST",
        body: { email: selectedEmail, newPassword },
      });
      setShowChangeModal(false);
      setNewPassword("");
      setError("");
      await refreshDashboard();
    } catch (requestError) {
      setError(getErrorMessage(requestError));
    }
  }

  async function deleteAdmin() {
    try {
      await apiFetch("/api/admin/delete", {
        method: "POST",
        body: { email: selectedEmail },
      });
      setShowDeleteModal(false);
      setError("");
      await refreshDashboard();
    } catch (requestError) {
      setError(getErrorMessage(requestError));
    }
  }

  async function clearCompletedTickets() {
    try {
      await apiFetch("/api/tickets/completed/clear", {
        method: "POST",
        body: {},
      });
      setShowClearModal(false);
      setError("");
      await refreshDashboard();
    } catch (requestError) {
      setError(getErrorMessage(requestError));
    }
  }

  async function restoreTicket(id) {
    try {
      await apiFetch(`/api/tickets/completed/restore/${id}`, {
        method: "POST",
        body: {},
      });
      setError("");
      await refreshDashboard();
    } catch (requestError) {
      setError(getErrorMessage(requestError));
    }
  }

  async function changeDirectorPassword() {
    try {
      const validationError = validatePasswordForm(directorNewPassword, "Director password");

      if (validationError) {
        setError(validationError);
        return;
      }

      await apiFetch("/api/director/update-password", {
        method: "POST",
        body: { newPassword: directorNewPassword },
      });
      await logout();
      navigate("/admin-login");
    } catch (requestError) {
      setError(getErrorMessage(requestError));
    }
  }

  async function logoutDirector() {
    await logout();
    navigate("/admin-login");
  }

  return (
    <div style={container}>
      <h1 style={title}>Director Dashboard</h1>
      {error && <p style={{ color: "#ef4444" }}>{error}</p>}

      <div style={topGrid}>
        <div style={panel}>
          <h2 style={subtitle}>Users Online</h2>
          {onlineUsers.length === 0 ? (
            <p style={emptyMessage}>No active users right now</p>
          ) : (
            onlineUsers.map((user) => (
              <div key={user.id} style={listCard}>
                <p style={cardText}><b>{user.email}</b> ({user.role})</p>
                <p style={mutedText}>Login: {formatDate(user.login_at)}</p>
                <p style={mutedText}>Last seen: {formatDate(user.last_seen_at)}</p>
                <p style={mutedText}>IP: {user.ip || "unknown"}</p>
              </div>
            ))
          )}
        </div>

        <div style={panel}>
          <h2 style={subtitle}>Recent Activity</h2>
          <div style={filtersRow}>
            <input
              placeholder="Actor email"
              value={auditEmailFilter}
              onChange={(e) => setAuditEmailFilter(e.target.value)}
              style={input}
            />
            <select value={auditStatusFilter} onChange={(e) => setAuditStatusFilter(e.target.value)} style={input}>
              <option value="">All statuses</option>
              <option value="success">success</option>
              <option value="failed">failed</option>
            </select>
          </div>
          {auditLogs.length === 0 ? (
            <p style={emptyMessage}>No logs yet</p>
          ) : (
            auditLogs.map((log) => (
              <div key={log.id} style={listCard}>
                <p style={cardText}>
                  <b>{log.event_type}</b> [{log.status}]
                </p>
                <p style={cardText}>{log.message}</p>
                <p style={mutedText}>
                  {log.actor_email || "system"} {log.actor_role ? `(${log.actor_role})` : ""}
                </p>
                <p style={mutedText}>{formatDate(log.created_at)}</p>
              </div>
            ))
          )}
          <PaginationControls
            page={auditMeta.page}
            totalPages={auditMeta.totalPages}
            onChange={(page) => loadAuditLogs(page, auditEmailFilter, auditStatusFilter)}
          />
        </div>
      </div>

      <div style={twoColumns}>
        <div style={leftColumn}>
          <h2 style={subtitle}>Admins</h2>
          {admins.map((admin) => (
            <div key={admin.id} style={card}>
              <p style={cardText}><b>Email:</b> {admin.email}</p>
              <div style={cardActions}>
                <button onClick={() => { setSelectedEmail(admin.email); setShowChangeModal(true); }} style={buttonSecondary}>
                  Change Password
                </button>
                <button onClick={() => { setSelectedEmail(admin.email); setShowDeleteModal(true); }} style={{ ...buttonSecondary, backgroundColor: "#b91c1c" }}>
                  Delete
                </button>
              </div>
            </div>
          ))}

          <div style={buttonGroup}>
            <button onClick={() => setShowAddModal(true)} style={buttonPrimary}>Add Admin</button>
            <button onClick={() => setShowDirectorPasswordModal(true)} style={buttonSecondary}>Change Director Password</button>
            <button onClick={() => setShowClearModal(true)} style={{ ...buttonSecondary, backgroundColor: "#b91c1c" }}>Clear Completed</button>
            <button onClick={logoutDirector} style={buttonSecondary}>Logout</button>
          </div>
        </div>

        <div style={rightColumn}>
          <h2 style={subtitle}>Completed Tickets</h2>
          <input
            placeholder="Filter completed by email"
            value={completedEmailFilter}
            onChange={(e) => setCompletedEmailFilter(e.target.value)}
            style={input}
          />
          <div style={ticketsList}>
            {completed.length === 0 ? (
              <p style={emptyMessage}>No completed tickets</p>
            ) : (
              completed.map((ticket) => {
                const expanded = expandedTickets[ticket.id];
                const isLong = ticket.message.length > 100;
                const text = expanded || !isLong ? ticket.message : `${ticket.message.slice(0, 100)}...`;
                return (
                  <div key={ticket.id} style={card}>
                    <p style={cardText}><b>Email:</b> {ticket.email}</p>
                    <p style={cardText}><b>Phone:</b> {ticket.phone}</p>
                    <p style={cardText}>
                      <b>Message:</b> {text}
                      {isLong && (
                        <button
                          onClick={() => setExpandedTickets((prev) => ({ ...prev, [ticket.id]: !prev[ticket.id] }))}
                          style={toggleButton}
                        >
                          {expanded ? "Collapse" : "Show full"}
                        </button>
                      )}
                    </p>
                    <p style={cardText}><b>Closed by:</b> {ticket.admin_email}</p>
                    <button onClick={() => restoreTicket(ticket.id)} style={buttonPrimary}>Restore</button>
                  </div>
                );
              })
            )}
          </div>
          <PaginationControls
            page={completedMeta.page}
            totalPages={completedMeta.totalPages}
            onChange={(page) => loadCompleted(page, completedEmailFilter)}
          />
        </div>
      </div>

      {showAddModal && (
        <Modal>
          <h3 style={modalTitle}>Add Admin</h3>
          <input type="email" placeholder="Email" value={newAdminEmail} onChange={(e) => setNewAdminEmail(e.target.value)} style={input} />
          <input type="password" placeholder="Password" value={newAdminPassword} onChange={(e) => setNewAdminPassword(e.target.value)} style={input} />
          <button onClick={addAdmin} style={modalButtonPrimary}>Create</button>
          <button onClick={() => setShowAddModal(false)} style={modalButtonSecondary}>Cancel</button>
        </Modal>
      )}

      {showChangeModal && (
        <Modal>
          <h3 style={modalTitle}>Change Admin Password</h3>
          <input type="password" placeholder="New password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} style={input} />
          <button onClick={changePassword} style={modalButtonPrimary}>Save</button>
          <button onClick={() => setShowChangeModal(false)} style={modalButtonSecondary}>Cancel</button>
        </Modal>
      )}

      {showDeleteModal && (
        <Modal>
          <h3 style={modalTitle}>Delete Admin</h3>
          <p style={modalText}>{selectedEmail}</p>
          <button onClick={deleteAdmin} style={modalButtonPrimary}>Delete</button>
          <button onClick={() => setShowDeleteModal(false)} style={modalButtonSecondary}>Cancel</button>
        </Modal>
      )}

      {showClearModal && (
        <Modal>
          <h3 style={modalTitle}>Clear Completed Tickets</h3>
          <p style={modalText}>This action cannot be undone.</p>
          <button onClick={clearCompletedTickets} style={modalButtonPrimary}>Clear</button>
          <button onClick={() => setShowClearModal(false)} style={modalButtonSecondary}>Cancel</button>
        </Modal>
      )}

      {showDirectorPasswordModal && (
        <Modal>
          <h3 style={modalTitle}>Change Director Password</h3>
          <input type="password" placeholder="New director password" value={directorNewPassword} onChange={(e) => setDirectorNewPassword(e.target.value)} style={input} />
          <button onClick={changeDirectorPassword} style={modalButtonPrimary}>Save</button>
          <button onClick={() => setShowDirectorPasswordModal(false)} style={modalButtonSecondary}>Cancel</button>
        </Modal>
      )}
    </div>
  );
}

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

const topGrid = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
  gap: "1.5rem",
  marginBottom: "2rem",
};

const twoColumns = { display: "flex", gap: "2rem", flexWrap: "wrap", alignItems: "flex-start" };
const leftColumn = { flex: "1", minWidth: "300px" };
const rightColumn = { flex: "1.5", minWidth: "350px" };
const panel = { border: "1px solid #2a2a2a", padding: 20, borderRadius: 10, backgroundColor: "#111111" };
const ticketsList = { maxHeight: "calc(100vh - 180px)", overflowY: "auto", paddingRight: "8px" };
const subtitle = { fontSize: "1.5rem", margin: "0 0 1rem 0", color: "#dddddd" };
const card = { border: "1px solid #2a2a2a", padding: 16, marginBottom: 16, borderRadius: 8, backgroundColor: "#111111", boxShadow: "0 2px 4px rgba(0,0,0,0.3)" };
const listCard = { border: "1px solid #2a2a2a", padding: 12, marginBottom: 12, borderRadius: 8, backgroundColor: "#151515" };
const cardText = { margin: "8px 0", color: "#cccccc", lineHeight: 1.4, wordBreak: "break-word" };
const mutedText = { margin: "4px 0", color: "#8f8f8f", fontSize: "0.9rem", wordBreak: "break-word" };
const cardActions = { display: "flex", gap: "10px", marginTop: 12 };
const buttonGroup = { display: "flex", flexWrap: "wrap", gap: "12px", marginTop: 20 };
const filtersRow = { display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 12 };
const paginationStyle = { display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, marginTop: 12 };
const buttonPrimary = { padding: "10px 20px", backgroundColor: "#2c2c2c", color: "#ffffff", border: "1px solid #444", borderRadius: 6, cursor: "pointer", fontWeight: 500 };
const buttonSecondary = { padding: "10px 20px", backgroundColor: "#1f1f1f", color: "#e0e0e0", border: "1px solid #333", borderRadius: 6, cursor: "pointer", fontWeight: 500 };
const toggleButton = { background: "none", border: "none", color: "#9ca3af", cursor: "pointer", marginLeft: 8, fontSize: "0.9rem", textDecoration: "underline" };
const emptyMessage = { color: "#888", textAlign: "center", padding: "1rem 0" };
const modalBg = { position: "fixed", top: 0, left: 0, width: "100%", height: "100%", backgroundColor: "rgba(0,0,0,0.85)", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 9999 };
const modalBox = { backgroundColor: "#1a1a1a", padding: 30, borderRadius: 12, width: 400, maxWidth: "90%", boxShadow: "0 10px 25px rgba(0,0,0,0.5)", border: "1px solid #333" };
const modalTitle = { marginTop: 0, marginBottom: 20, color: "#ffffff", fontSize: "1.5rem" };
const modalText = { marginBottom: 20, color: "#cccccc" };
const input = { width: "100%", padding: "10px 12px", marginBottom: 16, border: "1px solid #444", borderRadius: 6, fontSize: "1rem", boxSizing: "border-box", backgroundColor: "#2a2a2a", color: "#ffffff" };
const modalButtonPrimary = { width: "100%", padding: "10px 15px", backgroundColor: "#2c2c2c", color: "#ffffff", border: "1px solid #555", borderRadius: 6, marginTop: 8, cursor: "pointer", fontWeight: 500 };
const modalButtonSecondary = { width: "100%", padding: "10px 15px", backgroundColor: "#222", color: "#cccccc", border: "1px solid #444", borderRadius: 6, marginTop: 12, cursor: "pointer", fontWeight: 500 };
