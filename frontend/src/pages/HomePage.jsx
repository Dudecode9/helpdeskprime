import { useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import "./HomePage.css";

export default function HomePage() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (loading || !user) {
      return;
    }

    navigate(user.role === "director" ? "/director-dashboard" : "/admin-dashboard", {
      replace: true,
    });
  }, [loading, navigate, user]);

  return (
    <div className="home-container">
      <div className="header">HelpDesk Portal</div>
      <h1 className="title glitch">Select Access Mode</h1>
      <div className="button-group">
        <Link to="/user" className="home-btn user-btn">
          User
        </Link>
        <Link to="/admin-login" className="home-btn admin-btn">
          Staff Login
        </Link>
      </div>
    </div>
  );
}
