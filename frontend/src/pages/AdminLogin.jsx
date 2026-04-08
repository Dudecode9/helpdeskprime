import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import { apiFetch } from "../lib/api";
import { hasMedia, mediaLibrary } from "../lib/media";
import { validateLoginForm } from "../utils/validation";
import "./HomePage.css";

function getErrorMessage(error) {
  const validationError = error?.data?.errors?.[0]?.message;
  return validationError || error?.message || "Не удалось выполнить вход";
}

export default function AdminLogin() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();
  const { user, loading, refreshAuth } = useAuth();
  const loginMedia = mediaLibrary.publicPages.login;

  useEffect(() => {
    if (loading) {
      return;
    }

    if (user?.role === "director") {
      navigate("/director-dashboard", { replace: true });
    }

    if (user?.role === "admin") {
      navigate("/admin-dashboard", { replace: true });
    }
  }, [loading, navigate, user]);

  async function handleLogin(e) {
    e.preventDefault();
    setError("");
    const validationError = validateLoginForm({ email, password });

    if (validationError) {
      setError(validationError);
      return;
    }

    try {
      setSubmitting(true);
      await apiFetch("/api/auth/login/admin", {
        method: "POST",
        body: { email: email.trim(), password },
        skipRefresh: true,
      });
      await refreshAuth();
      navigate("/admin-dashboard", { replace: true });
    } catch (loginError) {
      setError(getErrorMessage(loginError));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="public-page">
      <div className="public-layout">
        <div className="public-topbar">
          <Link to="/" className="public-back-link">
            ← Вернуться на главную
          </Link>
          <div className="header-note">Служебный вход для сотрудников</div>
        </div>

        <section className="public-panel">
          <div className="public-panel-grid">
            <aside className="public-aside">
              {hasMedia(loginMedia.url) ? <img src={loginMedia.url} alt={loginMedia.alt} /> : null}
              <div className="public-aside-content">
                <span className="eyebrow">Служебный доступ</span>
                <h2>Вход для сотрудников и администрации</h2>
                <p>Закрытая часть для обработки заявок и внутренней работы с обращениями.</p>
              </div>
            </aside>

            <div className="public-content">
              <h2>Авторизация</h2>
              <p>Используйте рабочие учётные данные для входа в административную часть.</p>

              <form onSubmit={handleLogin} className="public-form">
                <div className="form-row">
                  <label htmlFor="admin-email">Электронная почта</label>
                  <input
                    id="admin-email"
                    type="email"
                    maxLength={255}
                    placeholder="Введите рабочий email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={submitting}
                    className="form-input"
                  />
                </div>

                <div className="form-row">
                  <label htmlFor="admin-password">Пароль</label>
                  <input
                    id="admin-password"
                    type="password"
                    maxLength={72}
                    placeholder="Введите пароль"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={submitting}
                    className="form-input"
                  />
                </div>

                {error ? <div className="form-message error">{error}</div> : null}

                <div className="form-actions">
                  <button type="submit" disabled={submitting} className="primary-button">
                    {submitting ? "Выполняется вход..." : "Войти"}
                  </button>
                  <button type="button" onClick={() => navigate("/")} disabled={submitting} className="secondary-button">
                    Назад
                  </button>
                </div>
              </form>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
