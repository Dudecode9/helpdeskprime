import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import { apiFetch } from "../lib/api";
import {
  validateAdminMutationForm,
  validatePasswordForm,
} from "../utils/validation";
import "./Dashboard.css";

function cn(...classes) {
  return classes.filter(Boolean).join(" ");
}

function getErrorMessage(error) {
  const validationError = error?.data?.errors?.[0]?.message;
  return validationError || error?.message || "Не удалось выполнить запрос";
}

function Modal({ title, text, children }) {
  return (
    <div className="dashboard-modal-backdrop">
      <div className="dashboard-modal">
        <h3 className="dashboard-modal-title">{title}</h3>
        {text ? <p className="dashboard-modal-text">{text}</p> : null}
        {children}
      </div>
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
  const [actionLoading, setActionLoading] = useState("");

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

      setActionLoading("add-admin");
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
    } finally {
      setActionLoading("");
    }
  }

  async function changePassword() {
    try {
      const validationError = validatePasswordForm(newPassword, "Новый пароль");

      if (validationError) {
        setError(validationError);
        return;
      }

      setActionLoading("change-admin-password");
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
    } finally {
      setActionLoading("");
    }
  }

  async function deleteAdmin() {
    try {
      setActionLoading("delete-admin");
      await apiFetch("/api/admin/delete", {
        method: "POST",
        body: { email: selectedEmail },
      });
      setShowDeleteModal(false);
      setError("");
      await refreshDashboard();
    } catch (requestError) {
      setError(getErrorMessage(requestError));
    } finally {
      setActionLoading("");
    }
  }

  async function clearCompletedTickets() {
    try {
      setActionLoading("clear-completed");
      await apiFetch("/api/tickets/completed/clear", {
        method: "POST",
        body: {},
      });
      setShowClearModal(false);
      setError("");
      await refreshDashboard();
    } catch (requestError) {
      setError(getErrorMessage(requestError));
    } finally {
      setActionLoading("");
    }
  }

  async function restoreTicket(id) {
    try {
      setActionLoading(`restore-${id}`);
      await apiFetch(`/api/tickets/completed/restore/${id}`, {
        method: "POST",
        body: {},
      });
      setError("");
      await refreshDashboard();
    } catch (requestError) {
      setError(getErrorMessage(requestError));
    } finally {
      setActionLoading("");
    }
  }

  async function changeDirectorPassword() {
    try {
      const validationError = validatePasswordForm(directorNewPassword, "Пароль директора");

      if (validationError) {
        setError(validationError);
        return;
      }

      setActionLoading("change-director-password");
      await apiFetch("/api/director/update-password", {
        method: "POST",
        body: { newPassword: directorNewPassword },
      });
      await logout();
      navigate("/admin-login");
    } catch (requestError) {
      setError(getErrorMessage(requestError));
    } finally {
      setActionLoading("");
    }
  }

  async function logoutDirector() {
    await logout();
    navigate("/admin-login");
  }

  async function refreshDirectorView() {
    await refreshDashboard();
  }

  return (
    <div className="dashboard-page">
      <div className="dashboard-shell">
        <header className="dashboard-header">
          <div className="dashboard-brand">
            <p className="dashboard-kicker">Панель директора</p>
            <h1 className="dashboard-title">Управление администраторами, историей и активностью</h1>
            <p className="dashboard-subtitle">
              Кабинет перестроен визуально в том же официальном стиле, но все рабочие действия и запросы к API оставлены без изменения.
            </p>
          </div>
          <div className="dashboard-actions">
            <button type="button" onClick={refreshDirectorView} className="dashboard-button dashboard-button-soft">
              Обновить данные
            </button>
            <button type="button" onClick={() => setShowAddModal(true)} className="dashboard-button dashboard-button-primary">
              Добавить администратора
            </button>
            <button type="button" onClick={logoutDirector} className="dashboard-button dashboard-button-danger">
              Выйти
            </button>
          </div>
        </header>

        {error ? <p className="dashboard-error">{error}</p> : null}

        <section className="dashboard-stats-grid">
          <article className="dashboard-stat">
            <span className="dashboard-stat-value">{admins.length}</span>
            <span className="dashboard-stat-label">Администраторов в системе</span>
          </article>
          <article className="dashboard-stat">
            <span className="dashboard-stat-value">{onlineUsers.length}</span>
            <span className="dashboard-stat-label">Пользователей онлайн прямо сейчас</span>
          </article>
          <article className="dashboard-stat">
            <span className="dashboard-stat-value">{auditLogs.length}</span>
            <span className="dashboard-stat-label">Записей активности на текущей странице</span>
          </article>
        </section>

        <div className="dashboard-top-grid" style={{ marginTop: 20 }}>
          <section className="dashboard-panel">
            <h2 className="dashboard-panel-title">Пользователи онлайн</h2>
            <div className="dashboard-scroll">
              {onlineUsers.length === 0 ? (
                <p className="dashboard-empty">Сейчас нет активных пользователей.</p>
              ) : (
                onlineUsers.map((user) => (
                  <article key={user.id} className="dashboard-card">
                    <h3 className="dashboard-card-title">
                      {user.email} <span className="dashboard-inline-label">({user.role})</span>
                    </h3>
                    <p className="dashboard-text">Вход: {formatDate(user.login_at)}</p>
                    <p className="dashboard-text">Последняя активность: {formatDate(user.last_seen_at)}</p>
                    <p className="dashboard-text">IP: {user.ip || "неизвестно"}</p>
                  </article>
                ))
              )}
            </div>
          </section>

          <section className="dashboard-panel">
            <div className="dashboard-toolbar">
              <div className="dashboard-brand" style={{ gap: 6 }}>
                <p className="dashboard-kicker">Активность</p>
                <h2 className="dashboard-panel-title" style={{ marginBottom: 0 }}>
                  Журнал действий
                </h2>
                <p className="dashboard-caption">Фильтры вынесены в верхнюю панель, чтобы журнал было легче просматривать в рабочем ритме.</p>
              </div>
              <div className="dashboard-toolbar-group">
                <input
                  placeholder="Email участника"
                  value={auditEmailFilter}
                  onChange={(e) => setAuditEmailFilter(e.target.value)}
                  className="dashboard-input dashboard-input-inline"
                />
                <select
                  value={auditStatusFilter}
                  onChange={(e) => setAuditStatusFilter(e.target.value)}
                  className="dashboard-select dashboard-select-inline"
                >
                  <option value="">Все статусы</option>
                  <option value="success">success</option>
                  <option value="failed">failed</option>
                </select>
                <button
                  type="button"
                  onClick={() => {
                    setAuditEmailFilter("");
                    setAuditStatusFilter("");
                  }}
                  className="dashboard-button dashboard-button-soft"
                >
                  Сбросить фильтры
                </button>
              </div>
            </div>

            <div className="dashboard-scroll">
              {auditLogs.length === 0 ? (
                <p className="dashboard-empty">Журнал пока пуст.</p>
              ) : (
                auditLogs.map((log) => (
                  <article key={log.id} className="dashboard-log">
                    <div className="dashboard-card-header">
                      <h3 className="dashboard-card-title">{log.event_type}</h3>
                      <span
                        className={cn(
                          "dashboard-badge",
                          log.status === "success" ? "dashboard-badge-success" : "dashboard-badge-failed",
                        )}
                      >
                        {log.status}
                      </span>
                    </div>
                    <p className="dashboard-text">{log.message}</p>
                    <p className="dashboard-text">
                      {log.actor_email || "system"} {log.actor_role ? `(${log.actor_role})` : ""}
                    </p>
                    <p className="dashboard-text">{formatDate(log.created_at)}</p>
                  </article>
                ))
              )}
            </div>
            <PaginationControls
              page={auditMeta.page}
              totalPages={auditMeta.totalPages}
              onChange={(page) => loadAuditLogs(page, auditEmailFilter, auditStatusFilter)}
            />
          </section>
        </div>

        <div className="dashboard-split" style={{ marginTop: 20 }}>
          <section className="dashboard-panel">
            <div className="dashboard-row" style={{ alignItems: "center", marginBottom: 14 }}>
              <h2 className="dashboard-panel-title" style={{ marginBottom: 0 }}>
                Администраторы
              </h2>
              <div className="dashboard-actions">
                <button type="button" onClick={() => setShowDirectorPasswordModal(true)} className="dashboard-button dashboard-button-secondary">
                  Сменить пароль директора
                </button>
                <button type="button" onClick={() => setShowClearModal(true)} className="dashboard-button dashboard-button-danger">
                  Очистить завершённые
                </button>
              </div>
            </div>

            <div className="dashboard-scroll">
              {admins.length === 0 ? (
                <p className="dashboard-empty">Администраторы не найдены.</p>
              ) : (
                admins.map((admin) => (
                  <article key={admin.id} className="dashboard-card">
                    <h3 className="dashboard-card-title">{admin.email}</h3>
                    <div className="dashboard-actions-row">
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedEmail(admin.email);
                          setShowChangeModal(true);
                        }}
                        className="dashboard-button dashboard-button-secondary"
                      >
                        Сменить пароль
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedEmail(admin.email);
                          setShowDeleteModal(true);
                        }}
                        className="dashboard-button dashboard-button-danger"
                      >
                        Удалить
                      </button>
                    </div>
                  </article>
                ))
              )}
            </div>
          </section>

          <section className="dashboard-panel">
            <div className="dashboard-toolbar">
              <div className="dashboard-brand" style={{ gap: 6 }}>
                <p className="dashboard-kicker">История</p>
                <h2 className="dashboard-panel-title" style={{ marginBottom: 0 }}>
                  Завершённые заявки
                </h2>
                <p className="dashboard-caption">Восстановление заявки остаётся доступным, а длинные сообщения можно раскрывать точечно.</p>
              </div>
              <div className="dashboard-toolbar-group">
                <input
                  placeholder="Фильтр по email"
                  value={completedEmailFilter}
                  onChange={(e) => setCompletedEmailFilter(e.target.value)}
                  className="dashboard-input dashboard-input-inline"
                />
                <button
                  type="button"
                  onClick={() => setCompletedEmailFilter("")}
                  className="dashboard-button dashboard-button-soft"
                >
                  Сбросить
                </button>
              </div>
            </div>

            <div className="dashboard-scroll">
              {completed.length === 0 ? (
                <p className="dashboard-empty">Нет завершённых заявок.</p>
              ) : (
                completed.map((ticket) => {
                  const expanded = expandedTickets[ticket.id];
                  const isLong = ticket.message.length > 100;
                  const text = expanded || !isLong ? ticket.message : `${ticket.message.slice(0, 100)}...`;

                  return (
                    <article key={ticket.id} className="dashboard-ticket">
                      <h3 className="dashboard-card-title">{ticket.email}</h3>
                      <p className="dashboard-text">Телефон: {ticket.phone}</p>
                      <p className="dashboard-text">
                        Сообщение: {text}
                        {isLong ? (
                          <button
                            type="button"
                            onClick={() => setExpandedTickets((prev) => ({ ...prev, [ticket.id]: !prev[ticket.id] }))}
                            className="dashboard-button dashboard-button-soft"
                            style={{ marginTop: 10 }}
                          >
                            {expanded ? "Свернуть" : "Показать полностью"}
                          </button>
                        ) : null}
                      </p>
                      <p className="dashboard-text">Закрыто: {ticket.admin_email}</p>
                      <div className="dashboard-actions-row">
                        <button
                          type="button"
                          onClick={() => restoreTicket(ticket.id)}
                          disabled={actionLoading === `restore-${ticket.id}`}
                          className="dashboard-button dashboard-button-primary"
                        >
                          {actionLoading === `restore-${ticket.id}` ? "Восстановление..." : "Восстановить"}
                        </button>
                      </div>
                    </article>
                  );
                })
              )}
            </div>
            <PaginationControls
              page={completedMeta.page}
              totalPages={completedMeta.totalPages}
              onChange={(page) => loadCompleted(page, completedEmailFilter)}
            />
          </section>
        </div>

        {showAddModal ? (
          <Modal title="Добавить администратора" text="Создайте новую учётную запись администратора. Логика создания остаётся прежней.">
            <input
              type="email"
              placeholder="Email"
              value={newAdminEmail}
              onChange={(e) => setNewAdminEmail(e.target.value)}
              disabled={actionLoading === "add-admin"}
              className="dashboard-input"
            />
            <div style={{ height: 10 }} />
            <input
              type="password"
              placeholder="Пароль"
              value={newAdminPassword}
              onChange={(e) => setNewAdminPassword(e.target.value)}
              disabled={actionLoading === "add-admin"}
              className="dashboard-input"
            />
            <div className="dashboard-modal-actions">
              <button
                type="button"
                onClick={addAdmin}
                disabled={actionLoading === "add-admin"}
                className="dashboard-button dashboard-button-primary"
              >
                {actionLoading === "add-admin" ? "Создание..." : "Создать"}
              </button>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                disabled={actionLoading === "add-admin"}
                className="dashboard-button dashboard-button-secondary"
              >
                Отмена
              </button>
            </div>
          </Modal>
        ) : null}

        {showChangeModal ? (
          <Modal title="Изменить пароль администратора" text={selectedEmail}>
            <input
              type="password"
              placeholder="Новый пароль"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              disabled={actionLoading === "change-admin-password"}
              className="dashboard-input"
            />
            <div className="dashboard-modal-actions">
              <button
                type="button"
                onClick={changePassword}
                disabled={actionLoading === "change-admin-password"}
                className="dashboard-button dashboard-button-primary"
              >
                {actionLoading === "change-admin-password" ? "Сохранение..." : "Сохранить"}
              </button>
              <button
                type="button"
                onClick={() => setShowChangeModal(false)}
                disabled={actionLoading === "change-admin-password"}
                className="dashboard-button dashboard-button-secondary"
              >
                Отмена
              </button>
            </div>
          </Modal>
        ) : null}

        {showDeleteModal ? (
          <Modal title="Удалить администратора" text={selectedEmail}>
            <div className="dashboard-modal-actions">
              <button
                type="button"
                onClick={deleteAdmin}
                disabled={actionLoading === "delete-admin"}
                className="dashboard-button dashboard-button-danger"
              >
                {actionLoading === "delete-admin" ? "Удаление..." : "Удалить"}
              </button>
              <button
                type="button"
                onClick={() => setShowDeleteModal(false)}
                disabled={actionLoading === "delete-admin"}
                className="dashboard-button dashboard-button-secondary"
              >
                Отмена
              </button>
            </div>
          </Modal>
        ) : null}

        {showClearModal ? (
          <Modal title="Очистить завершённые заявки" text="Это действие нельзя отменить.">
            <div className="dashboard-modal-actions">
              <button
                type="button"
                onClick={clearCompletedTickets}
                disabled={actionLoading === "clear-completed"}
                className="dashboard-button dashboard-button-danger"
              >
                {actionLoading === "clear-completed" ? "Очистка..." : "Очистить"}
              </button>
              <button
                type="button"
                onClick={() => setShowClearModal(false)}
                disabled={actionLoading === "clear-completed"}
                className="dashboard-button dashboard-button-secondary"
              >
                Отмена
              </button>
            </div>
          </Modal>
        ) : null}

        {showDirectorPasswordModal ? (
          <Modal title="Сменить пароль директора">
            <input
              type="password"
              placeholder="Новый пароль директора"
              value={directorNewPassword}
              onChange={(e) => setDirectorNewPassword(e.target.value)}
              disabled={actionLoading === "change-director-password"}
              className="dashboard-input"
            />
            <div className="dashboard-modal-actions">
              <button
                type="button"
                onClick={changeDirectorPassword}
                disabled={actionLoading === "change-director-password"}
                className="dashboard-button dashboard-button-primary"
              >
                {actionLoading === "change-director-password" ? "Сохранение..." : "Сохранить"}
              </button>
              <button
                type="button"
                onClick={() => setShowDirectorPasswordModal(false)}
                disabled={actionLoading === "change-director-password"}
                className="dashboard-button dashboard-button-secondary"
              >
                Отмена
              </button>
            </div>
          </Modal>
        ) : null}
      </div>
    </div>
  );
}
