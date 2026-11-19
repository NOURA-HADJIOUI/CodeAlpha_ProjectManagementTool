import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { io } from "socket.io-client";
import api, { SOCKET_URL } from "../api/axios";
import Board from "../components/Board";
import TaskModal from "../components/TaskModal";
import FilterBar from "../components/FilterBar";
import Avatar from "../components/Avatar";
import Icon from "../components/Icon";
import { isOverdue } from "../utils/helpers";

export default function ProjectBoard() {
  const { id } = useParams();
  const [project, setProject] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [socket, setSocket] = useState(null);
  const [selectedId, setSelectedId] = useState(null);
  const [filters, setFilters] = useState({ q: "", member: "", priority: "" });
  const [showInvite, setShowInvite] = useState(false);
  const [memberEmail, setMemberEmail] = useState("");
  const [error, setError] = useState("");

  const showError = (err) => setError(err.response?.data?.message || "Une erreur est survenue");
  const loadTasks = () =>
    api.get(`/tasks/project/${id}`).then((r) => setTasks(r.data)).catch(() => {});

  useEffect(() => {
    api.get(`/projects/${id}`).then((r) => setProject(r.data)).catch(() => setError("Projet introuvable"));
    loadTasks();
  }, [id]);

  useEffect(() => {
    const s = io(SOCKET_URL);
    s.emit("joinProject", id);
    s.on("taskCreated", (t) => setTasks((p) => (p.some((x) => x._id === t._id) ? p : [...p, t])));
    s.on("taskUpdated", (t) => setTasks((p) => p.map((x) => (x._id === t._id ? { ...x, ...t } : x))));
    s.on("taskDeleted", ({ _id }) => setTasks((p) => p.filter((x) => x._id !== _id)));
    s.on("commentAdded", ({ taskId }) =>
      setTasks((p) =>
        p.map((x) => (x._id === taskId ? { ...x, commentsCount: (x.commentsCount || 0) + 1 } : x))
      )
    );
    s.on("projectUpdated", (p) => {
      setProject(p);
      loadTasks();
    });
    setSocket(s);
    return () => {
      s.emit("leaveProject", id);
      s.disconnect();
    };
  }, [id]);

  // ---- Cartes ----
  const addTask = async (status, title) => {
    try {
      const { data } = await api.post("/tasks", { title, projectId: id, status });
      setTasks((p) => (p.some((x) => x._id === data._id) ? p : [...p, data]));
    } catch (err) {
      showError(err);
    }
  };

  const updateTask = async (taskId, updates) => {
    try {
      const { data } = await api.put(`/tasks/${taskId}`, updates);
      setTasks((p) => p.map((t) => (t._id === data._id ? { ...t, ...data } : t)));
    } catch (err) {
      showError(err);
    }
  };

  const moveTask = (taskId, status, index) => {
    const list = tasks
      .filter((t) => t.status === status && t._id !== taskId)
      .sort((a, b) => a.position - b.position);
    const prev = list[index - 1]?.position;
    const next = list[index]?.position;
    let position;
    if (prev === undefined && next === undefined) position = 1000;
    else if (prev === undefined) position = next - 1000;
    else if (next === undefined) position = prev + 1000;
    else position = (prev + next) / 2;

    setTasks((p) => p.map((t) => (t._id === taskId ? { ...t, status, position } : t)));
    updateTask(taskId, { status, position });
  };

  const deleteTask = async (taskId) => {
    try {
      await api.delete(`/tasks/${taskId}`);
      setTasks((p) => p.filter((t) => t._id !== taskId));
      setSelectedId(null);
    } catch (err) {
      showError(err);
    }
  };

  // ---- Listes ----
  const addColumn = async (title) => {
    try {
      const { data } = await api.post(`/projects/${id}/columns`, { title });
      setProject(data);
    } catch (err) {
      showError(err);
    }
  };

  const renameColumn = async (key, title) => {
    try {
      const { data } = await api.put(`/projects/${id}/columns/${key}`, { title });
      setProject(data);
    } catch (err) {
      showError(err);
    }
  };

  const deleteColumn = async (key) => {
    if (!window.confirm("Supprimer cette liste ? Ses cartes seront déplacées dans la première liste.")) return;
    try {
      const { data } = await api.delete(`/projects/${id}/columns/${key}`);
      setProject(data);
      loadTasks();
    } catch (err) {
      showError(err);
    }
  };

  // ---- Membres ----
  const addMember = async (e) => {
    e.preventDefault();
    try {
      const { data } = await api.post(`/projects/${id}/members`, { email: memberEmail });
      setProject(data);
      setMemberEmail("");
      setError("");
    } catch (err) {
      showError(err);
    }
  };

  if (!project) return <p>{error || "Chargement..."}</p>;

  // ---- Filtres et statistiques ----
  const doneKey = project.columns[project.columns.length - 1].key;
  const filtersActive = !!(filters.q || filters.member || filters.priority);

  const visible = tasks.filter((t) => {
    const text = `${t.title} ${t.description || ""} ${(t.labels || []).map((l) => l.text).join(" ")}`.toLowerCase();
    if (filters.q && !text.includes(filters.q.toLowerCase())) return false;
    if (filters.member === "none" && t.assignedTo) return false;
    if (filters.member && filters.member !== "none" && t.assignedTo?._id !== filters.member) return false;
    if (filters.priority && t.priority !== filters.priority) return false;
    return true;
  });

  const total = tasks.length;
  const done = tasks.filter((t) => t.status === doneKey).length;
  const overdue = tasks.filter((t) => isOverdue(t, doneKey)).length;
  const pct = total ? Math.round((done * 100) / total) : 0;

  const selected = tasks.find((t) => t._id === selectedId);

  return (
    <>
      <Link to="/projects" className="muted back-link"><Icon name="back" size={16} /> Retour aux projets</Link>

      <div className="board-header" style={{ borderLeftColor: project.color }}>
        <div>
          <h2>{project.name}</h2>
          {project.description && <p className="muted">{project.description}</p>}
        </div>
        <div className="header-right">
          <div className="avatars">
            {project.members.map((m) => (
              <Avatar key={m._id} name={m.name} size={32} />
            ))}
          </div>
          <button className="btn secondary" onClick={() => setShowInvite(!showInvite)}>
            + Inviter
          </button>
        </div>
      </div>

      {showInvite && (
        <form className="card inline-form" onSubmit={addMember}>
          <input
            type="email"
            placeholder="Email du membre à ajouter"
            value={memberEmail}
            onChange={(e) => setMemberEmail(e.target.value)}
            required
          />
          <button className="btn" type="submit">Ajouter</button>
        </form>
      )}

      {error && <p className="error">{error}</p>}

      <div className="stats">
        <span className="chip"><Icon name="lines" size={14} /> {total} carte(s)</span>
        <span className="chip complete"><Icon name="checkCircle" size={14} /> {done} terminée(s)</span>
        <span className={`chip ${overdue ? "overdue" : ""}`}><Icon name="clock" size={14} /> {overdue} en retard</span>
        <div className="progress stats-bar"><div style={{ width: `${pct}%` }} /></div>
        <span className="muted small">{pct}%</span>
      </div>

      <FilterBar filters={filters} setFilters={setFilters} members={project.members} />

      <Board
        columns={project.columns}
        tasks={visible}
        dragDisabled={filtersActive}
        onMove={moveTask}
        onOpen={setSelectedId}
        onAddTask={addTask}
        onAddColumn={addColumn}
        onRenameColumn={renameColumn}
        onDeleteColumn={deleteColumn}
      />

      {selected && (
        <TaskModal
          key={selected._id}
          task={selected}
          columns={project.columns}
          members={project.members}
          socket={socket}
          onClose={() => setSelectedId(null)}
          onSave={(updates) => updateTask(selected._id, updates)}
          onDelete={() => window.confirm("Supprimer cette carte ?") && deleteTask(selected._id)}
        />
      )}
    </>
  );
}