import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import { apiFetch } from "../lib/api";
import { validateLoginForm } from "../utils/validation";
import "./Dashboard.css";

function cn(...classes) {
  return classes.filter(Boolean).join(" ");
}

function TicketCard({ ticket, showClose, onClose, onStart, isStarting, isClosing }) {
  const [expanded, setExpanded] = useState(false);
  const statusLabel = ticket.status === "in_progress" ? "В работе" : "Активный";
  const badgeClass = ticket.status === "in_progress" ? "dashboard-badge-progress" : "dashboard-badge-active";

  return (
    <article className="dashboard-ticket">
      <div className="dashboard-ticket-header">
        <div>
          <h3 className="dashboard-card-title">{ticket.email}</h3>
          <p className="dashboard-text">
            <span className="dashboard-inline-label">Телефон:</span> {ticket.phone}
          </p>
          {ticket.admin_email ? (
            <p className="dashboard-text">
              <span className="dashboard-inline-label">Назначен:</span> {ticket.admin_email}
            </p>
          ) : null}
        </div>
        <span className={cn("dashboard-badge", badgeClass)}>{statusLabel}</span>
      </div>

      <p className="dashboard-text">
        <span className="dashboard-inline-label">Сообщение:</span>{" "}
        {expanded ? ticket.message : `${ticket.message.slice(0, 140)}${ticket.message.length > 140 ? "..." : ""}`}
      </p>

      <div className="dashboard-actions-row">
        {ticket.message.length > 140 ? (
          <button type="button" onClick={() => setExpanded((value) => !value)} className="dashboard-button dashboard-button-soft">
            {expanded ? "Свернуть" : "Развернуть"}
          </button>
        ) : null}

        <button
          type="button"
          onClick={() => navigator.clipboard.writeText(ticket.message)}
          className="dashboard-button dashboard-button-soft"
        >
          Скопировать
        </button>

        {showClose && ticket.status !== "in_progress" ? (
          <button
            type="button"
            onClick={onStart}
            disabled={isStarting || isClosing}
            className="dashboard-button dashboard-button-secondary"
          >
            {isStarting ? "Запуск..." : "Взять в работу"}
          </button>
        ) : null}

        {showClose ? (
          <button
            type="button"
            onClick={onClose}
            disabled={isStarting || isClosing}
            className="dashboard-button dashboard-button-danger"
          >
            {isClosing ? "Закрытие..." : "Закрыть"}
          </button>
        ) : null}
      </div>
    </article>
  );
}

function PaginationControls({ page, totalPages, onChange }) {
  return (
    <div className="dashboard-pagination">
      <button type="button" onClick={() => onChange(page - 1)} disabled={page <= 1} className="dashboard-button dashboard-button-secondary">
        Назад
      </button>
      <span className="dashboard-muted">
        Страница {page} из {totalPages}
      </span>
      <button
        type="button"
        onClick={() => onChange(page + 1)}
        disabled={page >= totalPages}
        className="dashboard-button dashboard-button-secondary"
      >
        Вперёд
      </button>
    </div>
  );
}

function getErrorMessage(error) {
  const validationError = error?.data?.errors?.[0]?.message;
  return validationError || error?.message || "Не удалось выполнить запрос";
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
  const [actionLoading, setActionLoading] = useState("");

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
    setActionLoading(`start-${id}`);
    try {
      const data = await apiFetch(`/api/tickets/start/${id}`, {
        method: "POST",
        body: {},
      });

      if (data.success) {
        await loadTickets(activeMeta.page, activeEmailFilter, activeStatusFilter);
      }
    } finally {
      setActionLoading("");
    }
  }

  async function closeTicket(id) {
    setActionLoading(`close-${id}`);
    try {
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
    } finally {
      setActionLoading("");
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
      setActionLoading("director-login");
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
    } finally {
      setActionLoading("");
    }
  }

  async function handleLogout() {
    await logout();
    navigate("/admin-login");
  }

  async function refreshAdminView() {
    await Promise.all([
      loadTickets(activeMeta.page, activeEmailFilter, activeStatusFilter),
      loadCompleted(completedMeta.page, completedEmailFilter),
    ]);
  }

  return (
    <div className="dashboard-page">
      <div className="dashboard-shell">
        <header className="dashboard-header">
          <div className="dashboard-brand">
            <p className="dashboard-kicker">Административная панель</p>
            <h1 className="dashboard-title">Рабочее пространство администратора</h1>
            <p className="dashboard-subtitle">
              Новый визуальный слой делает кабинет чище и спокойнее, но не трогает действия над тикетами, фильтры, пагинацию и текущие запросы к API.
            </p>
          </div>
          <div className="dashboard-actions">
            <button type="button" onClick={refreshAdminView} className="dashboard-button dashboard-button-soft">
              Обновить данные
            </button>
            <button type="button" onClick={() => setShowDirectorModal(true)} className="dashboard-button dashboard-button-secondary">
              Войти как директор
            </button>
            <button type="button" onClick={handleLogout} className="dashboard-button dashboard-button-danger">
              Выйти
            </button>
          </div>
        </header>

        <section className="dashboard-stats-grid">
          <article className="dashboard-stat">
            <span className="dashboard-stat-value">{tickets.length}</span>
            <span className="dashboard-stat-label">Активных заявок на текущей странице</span>
          </article>
          <article className="dashboard-stat">
            <span className="dashboard-stat-value">{completed.length}</span>
            <span className="dashboard-stat-label">Завершённых заявок на текущей странице</span>
          </article>
          <article className="dashboard-stat">
            <span className="dashboard-stat-value">{user?.email || "-"}</span>
            <span className="dashboard-stat-label">Текущий авторизованный администратор</span>
          </article>
        </section>

        <div className="dashboard-grid" style={{ marginTop: 20 }}>
          <aside className="dashboard-panel dashboard-panel-dark dashboard-sticky">
            <h2 className="dashboard-panel-title">Завершённые заявки</h2>
            <div className="dashboard-actions-compact">
              <input
                placeholder="Фильтр по email"
                value={completedEmailFilter}
                onChange={(e) => setCompletedEmailFilter(e.target.value)}
                className="dashboard-input"
              />
              <button
                type="button"
                onClick={() => setCompletedEmailFilter("")}
                className="dashboard-button dashboard-button-soft"
              >
                Сбросить
              </button>
            </div>
            <div className="dashboard-divider" />
            <div className="dashboard-scroll">
              {completed.length === 0 ? (
                <p className="dashboard-empty">Завершённых заявок пока нет.</p>
              ) : (
                completed.map((ticket) => <TicketCard key={ticket.id} ticket={ticket} showClose={false} />)
              )}
            </div>
            <PaginationControls
              page={completedMeta.page}
              totalPages={completedMeta.totalPages}
              onChange={(page) => loadCompleted(page, completedEmailFilter)}
            />
          </aside>

          <main className="dashboard-stack">
            <section className="dashboard-panel">
              <div className="dashboard-toolbar">
                <div className="dashboard-brand" style={{ gap: 6 }}>
                  <p className="dashboard-kicker">Активные заявки</p>
                  <h2 className="dashboard-panel-title" style={{ marginBottom: 0 }}>
                    Управление входящими обращениями
                  </h2>
                  <p className="dashboard-caption">Фильтры и рабочие действия вынесены в верхнюю панель, чтобы оператору было проще ориентироваться в потоке.</p>
                </div>
                <div className="dashboard-toolbar-group">
                  <input
                    placeholder="Фильтр по email"
                    value={activeEmailFilter}
                    onChange={(e) => setActiveEmailFilter(e.target.value)}
                    className="dashboard-input dashboard-input-inline"
                  />
                  <select
                    value={activeStatusFilter}
                    onChange={(e) => setActiveStatusFilter(e.target.value)}
                    className="dashboard-select dashboard-select-inline"
                  >
                    <option value="">Все статусы</option>
                    <option value="active">active</option>
                    <option value="in_progress">in_progress</option>
                  </select>
                  <button
                    type="button"
                    onClick={() => {
                      setActiveEmailFilter("");
                      setActiveStatusFilter("");
                    }}
                    className="dashboard-button dashboard-button-soft"
                  >
                    Сбросить фильтры
                  </button>
                </div>
              </div>

              <p className="dashboard-subtitle" style={{ marginTop: 14 }}>
                Все рабочие действия сохранены: можно взять тикет в работу, закрыть его, скопировать сообщение и перейти по страницам списка без изменения поведения.
              </p>
            </section>

            <section className="dashboard-panel">
              <div className="dashboard-scroll">
                {tickets.length === 0 ? (
                  <p className="dashboard-empty">Активных заявок нет.</p>
                ) : (
                  tickets.map((ticket) => (
                    <TicketCard
                      key={ticket.id}
                      ticket={ticket}
                      showClose
                      isStarting={actionLoading === `start-${ticket.id}`}
                      isClosing={actionLoading === `close-${ticket.id}`}
                      onStart={() => startTicket(ticket.id)}
                      onClose={() => closeTicket(ticket.id)}
                    />
                  ))
                )}
              </div>
              <PaginationControls
                page={activeMeta.page}
                totalPages={activeMeta.totalPages}
                onChange={(page) => loadTickets(page, activeEmailFilter, activeStatusFilter)}
              />
            </section>
          </main>
        </div>

        {showDirectorModal ? (
          <div className="dashboard-modal-backdrop">
            <div className="dashboard-modal">
              <h3 className="dashboard-modal-title">Вход директора</h3>
              <p className="dashboard-modal-text">
                Используйте учётные данные директора. Этот поток авторизации работает по прежней логике и только визуально оформлен в едином стиле.
              </p>
              <input
                type="email"
                placeholder="Email директора"
                value={directorEmail}
                onChange={(e) => setDirectorEmail(e.target.value)}
                disabled={actionLoading === "director-login"}
                className="dashboard-input"
              />
              <div style={{ height: 10 }} />
              <input
                type="password"
                placeholder="Пароль директора"
                value={directorPassword}
                onChange={(e) => setDirectorPassword(e.target.value)}
                disabled={actionLoading === "director-login"}
                className="dashboard-input"
              />
              {directorError ? <p className="dashboard-error" style={{ marginTop: 14, marginBottom: 0 }}>{directorError}</p> : null}
              <div className="dashboard-modal-actions">
                <button
                  type="button"
                  onClick={handleDirectorLogin}
                  disabled={actionLoading === "director-login"}
                  className="dashboard-button dashboard-button-primary"
                >
                  {actionLoading === "director-login" ? "Выполняется вход..." : "Войти"}
                </button>
                <button
                  type="button"
                  onClick={() => setShowDirectorModal(false)}
                  disabled={actionLoading === "director-login"}
                  className="dashboard-button dashboard-button-secondary"
                >
                  Отмена
                </button>
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
