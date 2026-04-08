import { useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import { hasMedia, mediaLibrary } from "../lib/media";
import "./HomePage.css";

const features = [
  {
    index: "01",
    title: "Официальный и аккуратный подход",
    text: "Главная страница выстроена как серьёзный лендинг услуг: понятный оффер, чистая структура и деловая логика без визуального шума.",
  },
  {
    index: "02",
    title: "Фирменный персонаж без потери доверия",
    text: "Нурик остаётся лицом бренда и помогает сайту запоминаться, но юмор встроен деликатно и не спорит с бизнес-задачей.",
  },
  {
    index: "03",
    title: "URL-медиа вместо тяжёлых ассетов",
    text: "Фотографии подключаются по ссылкам, поэтому визуал можно менять гибко, а проект и сервер не страдают от перегруженных файлов.",
  },
];

const services = [
  {
    title: "Установка пластиковых окон",
    text: "Услуга подаётся строго и понятно, с акцентом на качество, прозрачный путь клиента и уверенное первое впечатление.",
    points: ["Профессиональная подача сервиса", "Понятные CTA и блоки доверия", "Баланс имиджа и пользы"],
  },
  {
    title: "Замер и расчёт стоимости",
    text: "Блоки выстроены так, чтобы пользователь быстро понимал, что делать дальше и как начинается диалог с компанией.",
    points: ["Понятный сценарий обращения", "Спокойный деловой тон", "Минимум лишних шагов"],
  },
  {
    title: "Бренд с человеческим лицом",
    text: "Фирменный образ Нурика добавляет характер, но визуальный стиль остаётся официальным и профессиональным.",
    points: ["Характер без цирка", "Запоминаемость без потери лица", "Тёплая, но взрослая подача"],
  },
];

const workflow = [
  {
    step: "1",
    title: "Оставить заявку",
    text: "Клиент оставляет контакты и описание задачи через уже существующую форму.",
  },
  {
    step: "2",
    title: "Уточнить детали",
    text: "Коммуникация начинается в понятной и официальной рамке без путаницы в сценариях.",
  },
  {
    step: "3",
    title: "Подготовить решение",
    text: "Структура лендинга усиливает доверие к услуге и ведёт пользователя к действию.",
  },
  {
    step: "4",
    title: "Сохранить качество",
    text: "Редизайн меняет подачу, но не ломает роутинг, авторизацию и текущую бизнес-логику.",
  },
];

const reviews = [
  {
    title: "Солидно и читаемо",
    text: "Сайт выглядит современно и уверенно, при этом сохраняет характер бренда и ощущение живой компании.",
    person: "Оценка пользовательского восприятия",
  },
  {
    title: "Характер на месте",
    text: "Нурик остаётся запоминающимся образом, но теперь работает как брендовый акцент, а не как визуальный шум.",
    person: "Позиционирование бренда",
  },
  {
    title: "Функционал не тронут",
    text: "Все ключевые действия остаются на прежних маршрутах, а текущая логика API и валидации не меняется.",
    person: "Техническая безопасность редизайна",
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
          <strong>Позиционирование</strong>
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
              <p className="brand-title">Нурик Пласт Окна</p>
              <p className="brand-subtitle">Официальный сервис по установке пластиковых окон с фирменным характером</p>
            </div>
          </div>
          <div className="header-actions">
            <div className="header-note">3 фотографии достаточно, если у каждой есть точная роль</div>
            <Link to="/admin-login" className="ghost-button">
              Вход для сотрудников
            </Link>
          </div>
        </header>

        <section className="hero">
          <div className="hero-card">
            <span className="eyebrow">Новый публичный стиль</span>
            <h1 className="hero-title">
              Пластиковые окна <span>с серьёзной подачей</span> и узнаваемым лицом бренда
            </h1>
            <p className="hero-description">
              Главная страница перестраивается в официальный и профессиональный лендинг: с чётким оффером, сильной структурой, читаемыми блоками и аккуратным фирменным акцентом на образе Нурика.
            </p>
            <div className="hero-actions">
              <Link to="/user" className="primary-button">
                Оставить заявку
              </Link>
              <a href="#services" className="secondary-button">
                Посмотреть услуги
              </a>
            </div>
            <div className="hero-points">
              <div className="hero-point">
                <strong>3 фото</strong>
                <span>Hero, деловой блок доверия и фирменный завершающий акцент</span>
              </div>
              <div className="hero-point">
                <strong>0</strong>
                <span>Изменений в API, маршрутах, обработчиках и валидации</span>
              </div>
              <div className="hero-point">
                <strong>URL</strong>
                <span>Внешние медиа без тяжёлой загрузки в проект и без нагрузки на сервер</span>
              </div>
            </div>
          </div>

          <div className="hero-visual">
            <MediaCard
              media={hero}
              className="hero-photo-card"
              badgeText="Нурик остаётся узнаваемым персонажем, но визуальная система теперь работает как взрослый сервисный продукт."
            />
            <div className="glass-panel">
              <div className="metric-card">
                <span className="metric-value">Строго</span>
                <span className="metric-label">Основной тон первого экрана и ключевых действий</span>
              </div>
              <div className="metric-card">
                <span className="metric-value">Тепло</span>
                <span className="metric-label">Характер бренда и мягкий юмор в нужных местах</span>
              </div>
              <div className="metric-card">
                <span className="metric-value">Надёжно</span>
                <span className="metric-label">Редизайн не вмешивается в существующую бизнес-логику</span>
              </div>
            </div>
          </div>
        </section>

        <section className="section">
          <div className="section-header">
            <p className="section-kicker">Основа концепции</p>
            <h2 className="section-title">Сайт должен выглядеть как серьёзная услуга, а не как случайная шутка</h2>
            <p className="section-description">
              Поэтому юмор остаётся как брендовая подпись, а не как главная конструкция интерфейса. Каркас сайта решает деловую задачу: вызвать доверие и привести к заявке.
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
            <p className="section-kicker">Услуги</p>
            <h2 className="section-title">Подача услуг становится чище, солиднее и понятнее</h2>
            <p className="section-description">
              Публичная часть сайта должна объяснять, чем занимается компания, как выглядит процесс и почему клиенту удобно доверить ей работу.
            </p>
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
            <p className="section-kicker">О компании</p>
            <h2 className="section-title">Второе фото работает на доверие, а не на перегрузку</h2>
            <p className="section-description">
              Вместо большой галереи мы используем один уверенный деловой визуальный блок, который поддерживает историю компании, качество работы и чувство надёжности.
            </p>
          </div>
          <div className="story-grid">
            <article className="story-card">
              <div className="story-copy">
                <span className="eyebrow">Фото №2</span>
                <h3 className="section-title">Роль второго кадра: усилить доверие к компании и её подаче</h3>
                <p className="story-text">
                  Это место для спокойной, уверенной фотографии. Она может сопровождать блок о подходе, опыте, качестве сервиса и профессиональной дисциплине.
                </p>
                <ul className="note-list">
                  <li>Подходит для секции “О компании” или “Почему выбирают нас”.</li>
                  <li>Не конкурирует с первым экраном, а укрепляет впечатление.</li>
                  <li>Сохраняет взрослый визуальный ритм страницы.</li>
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
              <h3>Как распределяем 3 фотографии</h3>
              <ul className="note-list">
                <li>Фото 1: формирует первое впечатление и атмосферу сайта.</li>
                <li>Фото 2: помогает деловому блоку и усиливает доверие.</li>
                <li>Фото 3: завершает образ бренда и даёт характерный штрих.</li>
              </ul>
            </aside>
          </div>
        </section>

        <section className="section">
          <div className="section-header">
            <p className="section-kicker">Как мы работаем</p>
            <h2 className="section-title">Маршрут клиента остаётся прямым и понятным</h2>
            <p className="section-description">
              Это важно не только визуально. Новый стиль строится вокруг того, чтобы пользователь быстрее ориентировался, а мы не трогали уже работающие сценарии.
            </p>
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
            <p className="section-kicker">Отзывы и позиционирование</p>
            <h2 className="section-title">Новый стиль усиливает продукт, а не подменяет его собой</h2>
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
            <p className="section-kicker">Фирменный акцент</p>
            <h2 className="section-title">Третье фото оставляем для характерного, но всё ещё серьёзного финала</h2>
            <p className="section-description">
              Здесь уже можно чуть сильнее показать личность бренда. Но и этот блок продолжает общий стиль: официальный, собранный и аккуратный.
            </p>
          </div>
          <div className="story-grid">
            <article className="story-card">
              <div className="story-copy">
                <span className="eyebrow">Фото №3</span>
                <h3 className="section-title">Нурик как узнаваемое лицо бренда, а не случайный мем-элемент</h3>
                <p className="story-text">
                  Финальный акцент помогает запомнить сайт, но не разрушает доверие. Это взрослое брендирование с характером, а не карикатура на услугу.
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
              <h3>Почему функционал не страдает</h3>
              <ul className="note-list">
                <li>Маршруты `/user` и `/admin-login` не меняются.</li>
                <li>Редирект авторизованных пользователей остаётся прежним.</li>
                <li>Никакие вызовы `apiFetch`, проверки и роли не переписываются.</li>
              </ul>
            </aside>
          </div>
        </section>

        <section className="cta-panel">
          <div>
            <h2 className="cta-title">Следом переводим форму заявки и страницу входа в тот же официальный визуальный язык</h2>
            <p className="cta-text">
              Так публичный путь станет цельным: серьёзная главная, аккуратная форма заявки и такой же спокойный экран авторизации без конфликтов с текущей логикой.
            </p>
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
