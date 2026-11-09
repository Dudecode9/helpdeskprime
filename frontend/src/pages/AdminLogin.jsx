import { useEffect, useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import { apiFetch } from "../lib/api";
import { validateLoginForm } from "../utils/validation";
import "./NetworkLogin.css";

function getErrorMessage(error) {
  const validationError = error?.data?.errors?.[0]?.message;
  return validationError || error?.message || "Не удалось выполнить вход";
}

export default function AdminLogin() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("admin");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();
  const { user, loading, refreshAuth } = useAuth();

  useEffect(() => {
    if (loading) {
      return;
    }

    if (user?.role === "director" || user?.role === "admin") navigate("/network", { replace: true });
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
      await apiFetch(`/api/auth/login/${role}`, {
        method: "POST",
        body: { email: email.trim(), password },
        skipRefresh: true,
      });
      await refreshAuth();
      navigate("/network", { replace: true });
    } catch (loginError) {
      setError(getErrorMessage(loginError));
    } finally {
      setSubmitting(false);
    }
  }

  if (!loading && user?.role && ["admin", "director"].includes(user.role)) return <Navigate to="/network" replace />;

  return (
    <main className="network-login">
      <header className="login-header">
        <div className="login-brand"><span className="login-brand-mark">HP</span><div><strong>HELPDESKPRIME</strong><span>LOCAL NETWORK OPERATIONS</span></div></div>
        <span className="login-local"><i /> Локальная система</span>
      </header>
      <div className="login-layout">
        <section className="login-intro">
          <p className="login-kicker">СЕТЬ. СОСТОЯНИЕ. КОНТРОЛЬ.</p>
          <h1>Вся локальная сеть<br />в одном рабочем пространстве.</h1>
          <p className="login-summary">Интерфейсы, поток данных и сетевые инциденты. Без облака и без анализа содержимого пакетов.</p>
          <div className="login-signal" aria-hidden="true"><span /><span /><span /><span /><span /><span /><span /><span /><span /><span /><span /><span /><span /><span /><span /><span /><span /><span /><span /><span /><span /><span /><span /></div>
          <div className="login-intro-foot"><span>PROC / SYSFS</span><span>POSTGRESQL</span><span>LOOPBACK API</span></div>
        </section>
        <section className="login-panel">
          <div className="login-panel-heading"><span>ЗАЩИЩЁННЫЙ ДОСТУП</span><h2>Войти в монитор</h2><p>Используйте учётную запись администратора или директора.</p></div>
          <form onSubmit={handleLogin} className="login-form">
            <fieldset className="login-role-picker" disabled={submitting}>
              <legend>Роль</legend>
              <label className={role === "admin" ? "active" : ""}><input type="radio" name="role" value="admin" checked={role === "admin"} onChange={() => setRole("admin")} />Администратор</label>
              <label className={role === "director" ? "active" : ""}><input type="radio" name="role" value="director" checked={role === "director"} onChange={() => setRole("director")} />Директор</label>
            </fieldset>
            <label className="login-field"><span>Рабочий email</span><input type="email" autoComplete="username" maxLength={255} placeholder="name@company.local" value={email} onChange={(event) => setEmail(event.target.value)} disabled={submitting} required /></label>
            <label className="login-field"><span>Пароль</span><input type="password" autoComplete="current-password" maxLength={72} placeholder="Введите пароль" value={password} onChange={(event) => setPassword(event.target.value)} disabled={submitting} required /></label>
            {error ? <div className="login-error" role="alert">{error}</div> : null}
            <button type="submit" className="login-submit" disabled={submitting || loading}>{submitting ? "Проверяем доступ..." : "Открыть монитор"}<span aria-hidden="true">↗</span></button>
          </form>
          <div className="login-security"><span className="security-lock">●</span><span>Сессия защищена локальной авторизацией</span></div>
        </section>
      </div>
      <footer className="login-footer"><span>HELPDESKPRIME / NETWORK</span><span>ДАННЫЕ ОСТАЮТСЯ НА ЭТОМ УСТРОЙСТВЕ</span><span>v1.0</span></footer>
    </main>
  );
}
