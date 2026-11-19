import { useEffect, useState } from "react";
import { io } from "socket.io-client";
import api, { SOCKET_URL } from "../api/axios";
import { useAuth } from "../context/AuthContext";
import Icon from "./Icon";

export default function NotificationBell() {
  const { user } = useAuth();
  const [items, setItems] = useState([]);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    api.get("/notifications").then((r) => setItems(r.data)).catch(() => {});
    const s = io(SOCKET_URL);
    s.emit("joinUser", user.id);
    s.on("notification", (n) => setItems((p) => [n, ...p]));
    return () => s.disconnect();
  }, [user.id]);

  const unread = items.filter((n) => !n.read).length;

  const markAll = async () => {
    await api.put("/notifications/read-all");
    setItems((p) => p.map((n) => ({ ...n, read: true })));
  };

  return (
    <div className="bell">
      <button className="bell-btn" onClick={() => setOpen(!open)} aria-label="Notifications">
        <Icon name="bell" size={18} />
        {unread > 0 && <span className="bell-count">{unread}</span>}
      </button>
      {open && (
        <div className="bell-menu">
          <div className="bell-head">
            <strong>Notifications</strong>
            <button className="link-btn" onClick={markAll}>Tout marquer lu</button>
          </div>
          {items.length === 0 && <p className="muted small">Rien pour le moment.</p>}
          {items.map((n) => (
            <div key={n._id} className={`bell-item ${n.read ? "" : "unread"}`}>{n.message}</div>
          ))}
        </div>
      )}
    </div>
  );
}