import { Link } from "react-router-dom";
import "./HomePage.css";

export default function HomePage() {
  return (
    <div className="home-container">

      {/* Шапка */}
      <div className="header">HelpDesk Portal</div>

      {/* Подзаголовок */}
      <h1 className="title glitch">Выбор режима доступа</h1>

      {/* Кнопки */}
      <div className="button-group">
        <Link to="/user" className="home-btn user-btn">
          Пользователь
        </Link>

        <Link to="/admin-login" className="home-btn admin-btn">
          Администратор
        </Link>
      </div>
    </div>
  );
}
