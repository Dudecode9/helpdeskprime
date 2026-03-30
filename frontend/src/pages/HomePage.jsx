import { Link } from "react-router-dom";
import "./HomePage.css";

export default function HomePage() {
  return (
    <div className="home-container">
      <h1>Help Desk System</h1>

      <div className="button-group">
        <Link to="/user" className="home-btn user-btn">
          User
        </Link>

        <Link to="/admin-login" className="home-btn admin-btn">
          Admin
        </Link>
      </div>
    </div>
  );
}
