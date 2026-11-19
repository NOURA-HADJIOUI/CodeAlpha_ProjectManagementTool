import { useState } from "react";
import { NavLink, Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import NotificationBell from "./NotificationBell";
import Avatar from "./Avatar";
import Icon from "./Icon";

export default function Layout({ children }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);

  const search = (e) => {
    e.preventDefault();
    navigate(`/projects?q=${encodeURIComponent(q.trim())}`);
  };

  const item = ({ isActive }) => `nav-item ${isActive ? "active" : ""}`;

  return (
    <div className="app-shell">
      <aside className={`sidebar ${open ? "open" : ""}`} onClick={() => setOpen(false)}>
        <Link to="/" className="logo">
          <span className="logo-mark"><Icon name="kanban" size={18} /></span>
          Project Manager
        </Link>
        <NavLink to="/" end className={item}><Icon name="home" /> Tableau de bord</NavLink>
        <NavLink to="/projects" className={item}><Icon name="folder" /> Projets</NavLink>

        <div className="promo">
          <strong>Nouveau projet ?</strong>
          <p>Créez un tableau, invitez votre équipe et suivez l'avancement en temps réel.</p>
          <Link to="/projects" className="promo-btn">Créer un projet</Link>
        </div>

        <div className="sidebar-foot">
          <button className="nav-item" onClick={logout}><Icon name="logout" /> Déconnexion</button>
        </div>
      </aside>

      <div className="main">
        <header className="topbar">
          <button className="icon-btn menu-btn" onClick={() => setOpen(!open)} aria-label="Menu">
            <Icon name="menu" size={22} />
          </button>
          <form className="search-form" onSubmit={search}>
            <div className="search-box">
              <Icon name="search" size={16} />
              <input placeholder="Rechercher un projet..." value={q} onChange={(e) => setQ(e.target.value)} />
            </div>
          </form>
          <div className="topbar-right">
            <NotificationBell />
            <Avatar name={user.name} size={36} />
            <span className="user-name">{user.name}</span>
          </div>
        </header>
        <main className="main-content">{children}</main>
      </div>
    </div>
  );
}