import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { apiFetch } from "../lib/api";
import { hasMedia, mediaLibrary } from "../lib/media";
import { validateTicketForm } from "../utils/validation";
import "./HomePage.css";

function getErrorMessage(error) {
  const validationError = error?.data?.errors?.[0]?.message;
  return validationError || error?.message || "Не удалось отправить заявку";
}

export default function UserPage() {
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [message, setMessage] = useState("");
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();
  const requestMedia = mediaLibrary.publicPages.request;

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
      setSubmitting(true);
      await apiFetch("/api/tickets/submit", {
        method: "POST",
        body: {
          email: email.trim(),
          phone: phone.trim(),
          message: message.trim(),
        },
        skipRefresh: true,
      });
      setSuccess("Заявка успешно отправлена. Мы свяжемся с вами после уточнения деталей.");
      setEmail("");
      setPhone("");
      setMessage("");
    } catch (requestError) {
      setError(getErrorMessage(requestError));
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
          <div className="header-note">Сохраняем текущую логику формы и обновляем только внешний слой</div>
        </div>

        <section className="public-panel">
          <div className="public-panel-grid">
            <aside className="public-aside">
              {hasMedia(requestMedia.url) ? <img src={requestMedia.url} alt={requestMedia.alt} /> : null}
              <div className="public-aside-content">
                <span className="eyebrow">Приём заявок</span>
                <h1>Оставьте заявку на консультацию или расчёт</h1>
                <p>
                  Спокойная деловая форма без лишнего визуального шума. Пользователь понимает, что сделать дальше, а функционал отправки остаётся прежним.
                </p>
              </div>
            </aside>

            <div className="public-content">
              <h2>Связаться с нами</h2>
              <p>
                Оставьте контакты и кратко опишите задачу. Редизайн не меняет API-запрос, валидацию и маршрут страницы, поэтому бизнес-логика остаётся стабильной.
              </p>

              <form onSubmit={handleSubmit} className="public-form">
                <div className="form-row">
                  <label htmlFor="ticket-email">Электронная почта</label>
                  <input
                    id="ticket-email"
                    type="email"
                    maxLength={255}
                    placeholder="Например, client@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={submitting}
                    className="form-input"
                  />
                </div>

                <div className="form-row">
                  <label htmlFor="ticket-phone">Телефон</label>
                  <input
                    id="ticket-phone"
                    type="text"
                    maxLength={30}
                    placeholder="Укажите номер для связи"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    disabled={submitting}
                    className="form-input"
                  />
                </div>

                <div className="form-row">
                  <label htmlFor="ticket-message">Описание задачи</label>
                  <textarea
                    id="ticket-message"
                    maxLength={1000}
                    placeholder="Кратко опишите задачу, чтобы мы быстрее сориентировались"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    disabled={submitting}
                    className="form-textarea"
                  />
                </div>

                {success ? <div className="form-message success">{success}</div> : null}
                {error ? <div className="form-message error">{error}</div> : null}

                <div className="form-actions">
                  <button type="submit" disabled={submitting} className="primary-button">
                    {submitting ? "Отправка..." : "Отправить заявку"}
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
