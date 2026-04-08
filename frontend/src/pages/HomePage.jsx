import { useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import { hasMedia, mediaLibrary } from "../lib/media";
import "./HomePage.css";

const features = [
  {
    index: "01",
    title: "Заявки по окнам",
    text: "Принимаем обращения по замеру, установке, замене и сервису окон.",
  },
  {
    index: "02",
    title: "Короткая форма",
    text: "Нужны только контакты и краткое описание вопроса.",
  },
  {
    index: "03",
    title: "Отдельный личный запрос",
    text: "Нурлан открыт к серьёзному знакомству и ищет достойную жену.",
  },
];

const services = [
  {
    title: "Пластиковые окна",
    text: "Замер, установка, замена, расчёт стоимости.",
    points: ["Замер", "Установка", "Замена", "Консультация"],
  },
  {
    title: "Сервисный вопрос",
    text: "Можно оставить запрос по существующим окнам или уточнить условия работ.",
    points: ["Сроки", "Стоимость", "Состояние окон"],
  },
  {
    title: "Знакомство с Нурланом",
    text: "Если цель обращения личная, это тоже можно указать в заявке.",
    points: ["Серьёзный формат", "Уважительное общение", "Без лишней публичности"],
  },
];

const workflow = [
  {
    step: "1",
    title: "Оставить заявку",
    text: "Укажите контакты и коротко опишите цель обращения.",
  },
  {
    step: "2",
    title: "Дождаться ответа",
    text: "После просмотра заявки будет обратная связь.",
  },
  {
    step: "3",
    title: "Перейти к делу",
    text: "По окнам — замер и расчёт. По знакомству — дальнейшее общение.",
  },
];

const reviews = [
  {
    title: "Строгая подача",
    text: "Текст стал короче и спокойнее. Сайт выглядит собранно.",
    person: "Публичная часть",
  },
  {
    title: "Понятная цель",
    text: "Сразу ясно, что сюда можно написать по окнам или обратиться к Нурлану лично.",
    person: "Структура сайта",
  },
  {
    title: "Без лишнего шума",
    text: "Минимум рекламных формулировок и больше конкретики.",
    person: "Тон страницы",
  },
];

function MediaCard({ media, className, badgeText }) {
  return (
    <div className={className}>
      {hasMedia(media.url) ? (
        <img src={media.url} alt={media.alt} className="hero-photo" />
      ) : (
        <div className="photo-fallback">
          <span className="photo-label">{media.label}</span>
          <strong>{media.title}</strong>
          <span>{media.description}</span>
        </div>
      )}
      {badgeText ? (
        <div className="floating-badge">
          <strong>Нурлан</strong>
          <span>{badgeText}</span>
        </div>
      ) : null}
    </div>
  );
}

export default function HomePage() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const { hero, company, persona } = mediaLibrary.home;

  useEffect(() => {
    if (loading || !user) {
      return;
    }

    navigate(user.role === "director" ? "/director-dashboard" : "/admin-dashboard", {
      replace: true,
    });
  }, [loading, navigate, user]);

  return (
    <div className="home-page">
      <div className="home-shell">
        <header className="home-header">
          <div className="brand-lockup">
            <div className="brand-badge">Н</div>
            <div className="brand-copy">
              <p className="brand-title">Нурлан Окна</p>
              <p className="brand-subtitle">Заявки по окнам и отдельный канал для знакомства</p>
            </div>
          </div>
          <div className="header-actions">
            <div className="header-note">Строго. Коротко. По делу.</div>
            <Link to="/admin-login" className="ghost-button">
              Вход для сотрудников
            </Link>
          </div>
        </header>

        <section className="hero">
          <div className="hero-card">
            <span className="eyebrow">Приём обращений</span>
            <h1 className="hero-title">
              Окна, сервис и <span>обратная связь</span> без лишнего текста
            </h1>
            <p className="hero-description">
              Через сайт можно оставить заявку по окнам: замер, установка, замена, консультация. Отдельно Нурлан
              рассматривает серьёзное знакомство и ищет достойную жену.
            </p>
            <div className="hero-actions">
              <Link to="/user" className="primary-button">
                Оставить заявку
              </Link>
              <a href="#services" className="secondary-button">
                Что можно отправить
              </a>
            </div>
            <div className="hero-points">
              <div className="hero-point">
                <strong>Окна</strong>
                <span>Замер, установка, расчёт, сервис</span>
              </div>
              <div className="hero-point">
                <strong>Знакомство</strong>
                <span>Отдельная заявка для Нурлана</span>
              </div>
              <div className="hero-point">
                <strong>Форма</strong>
                <span>Короткое и понятное обращение</span>
              </div>
            </div>
          </div>

          <div className="hero-visual">
            <MediaCard
              media={hero}
              className="hero-photo-card"
              badgeText="Ищет достойную, порядочную жену и открыт к серьёзному знакомству."
            />
            <div className="glass-panel">
              <div className="metric-card">
                <span className="metric-value">Строго</span>
                <span className="metric-label">Сдержанный тон и короткие блоки</span>
              </div>
              <div className="metric-card">
                <span className="metric-value">Ясно</span>
                <span className="metric-label">Сразу понятно, зачем сюда обращаться</span>
              </div>
              <div className="metric-card">
                <span className="metric-value">Лично</span>
                <span className="metric-label">Есть отдельный акцент на Нурлане</span>
              </div>
            </div>
          </div>
        </section>

        <section className="section">
          <div className="section-header">
            <p className="section-kicker">Формат</p>
            <h2 className="section-title">Сайт объясняет задачу быстро и без перегруза</h2>
            <p className="section-description">
              Это рабочая страница для тех, кому нужно написать по окнам или обратиться к Нурлану лично.
            </p>
          </div>
          <div className="feature-grid">
            {features.map((feature) => (
              <article key={feature.index} className="content-card">
                <span className="card-index">{feature.index}</span>
                <h3 className="card-title">{feature.title}</h3>
                <p className="card-text">{feature.text}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="section" id="services">
          <div className="section-header">
            <p className="section-kicker">Темы обращений</p>
            <h2 className="section-title">Через форму можно отправить один из трёх типов заявок</h2>
          </div>
          <div className="service-grid">
            {services.map((service) => (
              <article key={service.title} className="service-card">
                <h3 className="service-title">{service.title}</h3>
                <p className="service-text">{service.text}</p>
                <ul className="service-list">
                  {service.points.map((point) => (
                    <li key={point}>{point}</li>
                  ))}
                </ul>
              </article>
            ))}
          </div>
        </section>

        <section className="section">
          <div className="section-header">
            <p className="section-kicker">О Нурлане</p>
            <h2 className="section-title">Нурлан работает с окнами и ищет достойную жену</h2>
            <p className="section-description">
              Личный блок оставлен открыто, но спокойно и без лишней театральности.
            </p>
          </div>
          <div className="story-grid">
            <article className="story-card">
              <div className="story-copy">
                <span className="eyebrow">Личный блок</span>
                <h3 className="section-title">Серьёзно и уважительно</h3>
                <p className="story-text">
                  Нурлан подаётся как реальный человек: занимается окнами, держит деловой тон и открыт к знакомству с
                  достойной, порядочной женщиной.
                </p>
                <ul className="note-list">
                  <li>Серьёзное знакомство, а не случайная переписка.</li>
                  <li>Спокойный и уважительный формат обращения.</li>
                  <li>Один канал связи через форму заявки.</li>
                </ul>
              </div>
              <div className="story-photo-wrap">
                {hasMedia(company.url) ? (
                  <img src={company.url} alt={company.alt} className="story-photo" />
                ) : (
                  <div className="photo-fallback">
                    <span className="photo-label">{company.label}</span>
                    <strong>{company.title}</strong>
                    <span>{company.description}</span>
                  </div>
                )}
              </div>
            </article>

            <aside className="story-side-panel">
              <h3>Когда сюда пишут</h3>
              <ul className="note-list">
                <li>Нужно заказать окна или вызвать замер.</li>
                <li>Нужно уточнить стоимость и условия работ.</li>
                <li>Есть цель познакомиться с Нурланом для серьёзных отношений.</li>
              </ul>
            </aside>
          </div>
        </section>

        <section className="section">
          <div className="section-header">
            <p className="section-kicker">Как это работает</p>
            <h2 className="section-title">Маршрут посетителя короткий и понятный</h2>
          </div>
          <div className="timeline">
            {workflow.map((item) => (
              <article key={item.step} className="timeline-item">
                <span className="timeline-step">{item.step}</span>
                <h3 className="timeline-title">{item.title}</h3>
                <p className="timeline-text">{item.text}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="section">
          <div className="section-header">
            <p className="section-kicker">Оценка подачи</p>
            <h2 className="section-title">Публичная часть стала строже и яснее</h2>
          </div>
          <div className="review-grid">
            {reviews.map((review) => (
              <article key={review.title} className="review-card">
                <h3 className="review-title">{review.title}</h3>
                <p className="review-text">{review.text}</p>
                <p className="story-text">{review.person}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="section">
          <div className="section-header">
            <p className="section-kicker">Финальный акцент</p>
            <h2 className="section-title">Лицо сайта остаётся узнаваемым</h2>
            <p className="section-description">
              Сайт остаётся рабочим сервисом, но при этом прямо говорит о личном запросе Нурлана.
            </p>
          </div>
          <div className="story-grid">
            <article className="story-card">
              <div className="story-copy">
                <span className="eyebrow">Финальный блок</span>
                <h3 className="section-title">Окна, ответственность и серьёзные намерения</h3>
                <p className="story-text">
                  Нурлан открыт к знакомству и ищет достойную жену. Если цель обращения личная, это можно указать прямо
                  в заявке.
                </p>
              </div>
              <div className="story-photo-wrap">
                {hasMedia(persona.url) ? (
                  <img src={persona.url} alt={persona.alt} className="story-photo" />
                ) : (
                  <div className="photo-fallback">
                    <span className="photo-label">{persona.label}</span>
                    <strong>{persona.title}</strong>
                    <span>{persona.description}</span>
                  </div>
                )}
              </div>
            </article>

            <aside className="story-side-panel">
              <h3>Что не меняется</h3>
              <ul className="note-list">
                <li>Маршруты `/user` и `/admin-login` остаются прежними.</li>
                <li>API и логика формы не ломаются.</li>
                <li>Публичная часть стала короче и строже.</li>
              </ul>
            </aside>
          </div>
        </section>

        <section className="cta-panel">
          <div>
            <h2 className="cta-title">Если вопрос по окнам или есть цель познакомиться, можно написать сразу</h2>
            <p className="cta-text">Форма одна, сценарии понятны, текста ровно столько, сколько нужно.</p>
          </div>
          <div className="cta-actions">
            <Link to="/user" className="primary-button">
              Оставить заявку
            </Link>
            <Link to="/admin-login" className="secondary-button">
              Вход для сотрудников
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
}
