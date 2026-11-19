import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import NotificationBell from "./NotificationBell";

export default function Navbar() {
  const { user, logout } = useAuth();
  return (
    <nav className="navbar">
      <Link to="/" className="brand">Project Manager</Link>
      <div className="nav-right">
        <NotificationBell />
        <span className="user-name">{user.name}</span>
        <button className="btn secondary" onClick={logout}>Déconnexion</button>
      </div>
    </nav>
  );
}