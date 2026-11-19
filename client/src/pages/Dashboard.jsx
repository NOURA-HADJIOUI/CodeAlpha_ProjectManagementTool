import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import api from "../api/axios";
import { useAuth } from "../context/AuthContext";
import Avatar from "../components/Avatar";
import Icon from "../components/Icon";
import { PRIORITIES, fmtDate, toInputDate, isOverdue } from "../utils/helpers";

const pad = (n) => String(n).padStart(2, "0");
const ymd = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const DAYS = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];

export default function Dashboard() {
  const { user } = useAuth();
  const [projects, setProjects] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [boardId, setBoardId] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const { data: projs } = await api.get("/projects");
        const lists = await Promise.all(
          projs.map((p) => api.get(`/tasks/project/${p._id}`).then((r) => r.data).catch(() => []))
        );
        setProjects(projs);
        setTasks(lists.flat());
        if (projs[0]) setBoardId(projs[0]._id);
      } catch (err) {
        setError(err.response?.data?.message || "Impossible de charger le tableau de bord.");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const d = useMemo(() => {
    const byProject = Object.fromEntries(projects.map((p) => [p._id, p]));
    const firstKey = (t) => byProject[t.project]?.columns?.[0]?.key;
    const lastKey = (t) => {
      const c = byProject[t.project]?.columns;
      return c?.[c.length - 1]?.key;
    };
    const isDone = (t) => t.status === lastKey(t);
    const isTodo = (t) => t.status === firstKey(t) && !isDone(t);

    const done = tasks.filter(isDone).length;
    const todo = tasks.filter(isTodo).length;
    const progress = tasks.length - done - todo;
    const overdue = tasks.filter((t) => isOverdue(t, lastKey(t))).length;

    const progressByProject = projects.map((p) => {
      const mine = tasks.filter((t) => t.project === p._id);
      const dn = mine.filter(isDone).length;
      return { ...p, total: mine.length, pct: mine.length ? Math.round((dn * 100) / mine.length) : 0 };
    });

    const members = new Map();
    projects.forEach((p) => p.members.forEach((m) => members.set(m._id, m)));
    const team = [...members.values()].map((m) => ({
      ...m,
      open: tasks.filter((t) => t.assignedTo?._id === m._id && !isDone(t)).length,
    }));

    const now = new Date();
    const monday = new Date(now);
    monday.setDate(now.getDate() - ((now.getDay() + 6) % 7));
    const week = DAYS.map((label, i) => {
      const day = new Date(monday);
      day.setDate(monday.getDate() + i);
      return { label, num: day.getDate(), key: ymd(day), today: ymd(day) === ymd(now) };
    });
    const weekKeys = new Set(week.map((w) => w.key));
    const dues = tasks
      .filter((t) => t.dueDate && !isDone(t) && weekKeys.has(toInputDate(t.dueDate)))
      .sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate));
    const dueKeys = new Set(dues.map((t) => toInputDate(t.dueDate)));

    const activity = Array.from({ length: 7 }, (_, i) => {
      const day = new Date(now);
      day.setDate(now.getDate() - (6 - i));
      const key = ymd(day);
      return {
        label: DAYS[(day.getDay() + 6) % 7],
        created: tasks.filter((t) => ymd(new Date(t.createdAt)) === key).length,
        completed: tasks.filter((t) => isDone(t) && ymd(new Date(t.updatedAt)) === key).length,
      };
    });
    const maxAct = Math.max(1, ...activity.flatMap((a) => [a.created, a.completed]));

    return { byProject, done, todo, progress, overdue, progressByProject, team, week, dues, dueKeys, activity, maxAct };
  }, [projects, tasks]);

  const total = tasks.length;
  const donePct = total ? (d.done * 100) / total : 0;
  const progPct = total ? (d.progress * 100) / total : 0;
  const donut = total
    ? `conic-gradient(var(--accent-green) 0 ${donePct}%, var(--accent-violet) ${donePct}% ${donePct + progPct}%, var(--accent-amber) ${donePct + progPct}% 100%)`
    : "var(--accent-violet-soft)";

  const hour = new Date().getHours();
  const hello = hour < 12 ? "Bonjour" : hour < 18 ? "Bon après-midi" : "Bonsoir";
  const today = new Date().toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long", year: "numeric" });

  const stats = [
    { label: "Projets actifs", value: projects.length, sub: `${total} tâche(s) au total`, icon: "folder", bg: "var(--accent-violet-soft)", fg: "var(--accent-violet)" },
    { label: "Tâches terminées", value: d.done, sub: `${Math.round(donePct)} % du total`, icon: "checkCircle", bg: "var(--accent-green)", fg: "#fff" },
    { label: "Tâches en attente", value: total - d.done, sub: `${d.overdue} en retard`, icon: "clock", bg: "var(--accent-amber)", fg: "#fff" },
    { label: "Membres d'équipe", value: d.team.length, sub: `dans ${projects.length} projet(s)`, icon: "users", bg: "var(--accent-coral)", fg: "#fff" },
  ];

  const boardProject = d.byProject[boardId];
  const boardTasks = tasks.filter((t) => t.project === boardId);

  if (loading) return <p className="muted">Chargement...</p>;
  if (error) return <p className="error">{error}</p>;

  return (
    <>
      <div className="greeting">
        <div>
          <h2>{hello}, {user.name}</h2>
          <p className="muted">Voici ce qui se passe dans vos projets aujourd'hui.</p>
        </div>
        <span className="date-pill"><Icon name="calendar" size={16} /> {today}</span>
      </div>

      <div className="stat-grid">
        {stats.map((s) => (
          <div key={s.label} className="panel stat-card">
            <span className="stat-icon" style={{ background: s.bg, color: s.fg }}>
              <Icon name={s.icon} size={24} />
            </span>
            <div>
              <span className="muted small">{s.label}</span>
              <strong>{s.value}</strong>
              <span className="stat-sub">{s.sub}</span>
            </div>
          </div>
        ))}
      </div>

      <div className="dash-grid-3">
        <section className="panel">
          <div className="panel-head">
            <h4>Progression des projets</h4>
            <Link to="/projects" className="more">Voir tout <Icon name="arrow" size={14} /></Link>
          </div>
          {d.progressByProject.slice(0, 5).map((p) => (
            <Link key={p._id} to={`/projects/${p._id}`} className="proj-row">
              <span className="dot" style={{ background: p.color }} />
              <div className="proj-info">
                <div className="proj-line"><strong>{p.name}</strong><span>{p.pct} %</span></div>
                <div className="progress"><div style={{ width: `${p.pct}%`, background: p.color }} /></div>
              </div>
            </Link>
          ))}
          {projects.length === 0 && (
            <p className="muted small">Aucun projet. <Link to="/projects">Créer le premier</Link></p>
          )}
        </section>

        <section className="panel">
          <div className="panel-head"><h4>Vue d'ensemble des tâches</h4></div>
          <div className="donut-wrap">
            <div className="donut" style={{ background: donut }}>
              <div className="donut-hole">
                <strong>{total}</strong>
                <span className="muted small">Tâches</span>
              </div>
            </div>
            <ul className="legend">
              <li><i style={{ background: "var(--accent-green)" }} />Terminées <b>{d.done}</b></li>
              <li><i style={{ background: "var(--accent-violet)" }} />En cours <b>{d.progress}</b></li>
              <li><i style={{ background: "var(--accent-amber)" }} />À faire <b>{d.todo}</b></li>
            </ul>
          </div>
        </section>

        <section className="panel">
          <div className="panel-head"><h4>Cette semaine</h4></div>
          <div className="week-strip">
            {d.week.map((w) => (
              <div key={w.key} className={`day ${w.today ? "today" : ""}`}>
                <span>{w.label}</span>
                <strong>{w.num}</strong>
                <i className={d.dueKeys.has(w.key) ? "has" : ""} />
              </div>
            ))}
          </div>
          {d.dues.slice(0, 4).map((t) => (
            <Link key={t._id} to={`/projects/${t.project}`} className="due-item">
              <span className="dot" style={{ background: d.byProject[t.project]?.color }} />
              <div className="proj-info">
                <strong>{t.title}</strong>
                <span className="muted small">{fmtDate(t.dueDate)} · {d.byProject[t.project]?.name}</span>
              </div>
              {t.assignedTo && <Avatar name={t.assignedTo.name} size={24} />}
            </Link>
          ))}
          {d.dues.length === 0 && <p className="muted small">Aucune échéance cette semaine.</p>}
        </section>
      </div>

      <div className="dash-grid-2">
        <section className="panel">
          <div className="panel-head"><h4>Membres de l'équipe</h4></div>
          {d.team.map((m) => (
            <div key={m._id} className="member-row">
              <Avatar name={m.name} size={38} />
              <div className="proj-info">
                <strong>{m.name}</strong>
                <span className="muted small">{m.email}</span>
              </div>
              <span className={`pill ${m.open ? "" : "ok"}`}>{m.open ? `${m.open} en cours` : "Disponible"}</span>
            </div>
          ))}
          {d.team.length === 0 && <p className="muted small">Aucun membre pour le moment.</p>}
        </section>

        <section className="panel">
          <div className="panel-head">
            <h4>Activité des tâches</h4>
            <span className="muted small">7 derniers jours</span>
          </div>
          <div className="bars">
            {d.activity.map((a, i) => (
              <div key={i} className="bar-col">
                <div className="bar-pair">
                  <div className="bar completed" style={{ height: `${(a.completed / d.maxAct) * 100}%` }} title={`${a.completed} terminée(s)`} />
                  <div className="bar created" style={{ height: `${(a.created / d.maxAct) * 100}%` }} title={`${a.created} créée(s)`} />
                </div>
                <span className="muted small">{a.label}</span>
              </div>
            ))}
          </div>
          <ul className="legend row-legend">
            <li><i style={{ background: "var(--accent-green)" }} />Terminées</li>
            <li><i style={{ background: "var(--accent-violet)" }} />Créées</li>
          </ul>
        </section>
      </div>

      {boardProject && (
        <section className="panel">
          <div className="panel-head">
            <h4><Icon name="kanban" size={18} /> Tableau Kanban</h4>
            <div className="row">
              <select value={boardId} onChange={(e) => setBoardId(e.target.value)}>
                {projects.map((p) => (
                  <option key={p._id} value={p._id}>{p.name}</option>
                ))}
              </select>
              <Link to={`/projects/${boardId}`} className="btn">
                Voir le tableau complet <Icon name="arrow" size={14} />
              </Link>
            </div>
          </div>
          <div className="mini-board">
            {boardProject.columns.map((c, i) => {
              const list = boardTasks.filter((t) => t.status === c.key).sort((a, b) => a.position - b.position);
              return (
                <div key={c.key} className={`mini-col tone-${i % 4}`}>
                  <div className="mini-head">{c.title} <span className="count">{list.length}</span></div>
                  {list.slice(0, 3).map((t) => {
                    const priority = PRIORITIES[t.priority];
                    return (
                      <Link key={t._id} to={`/projects/${boardId}`} className="mini-card">
                        <strong>{t.title}</strong>
                        <div className="card-meta">
                          {priority && t.priority !== "none" && (
                            <span className="chip" style={{ borderColor: priority.color, color: priority.color }}>
                              {priority.label}
                            </span>
                          )}
                          {t.dueDate && (
                            <span className="chip"><Icon name="clock" size={12} /> {fmtDate(t.dueDate)}</span>
                          )}
                          {t.assignedTo && <span className="card-avatar"><Avatar name={t.assignedTo.name} size={22} /></span>}
                        </div>
                      </Link>
                    );
                  })}
                  {list.length > 3 && <span className="muted small">+ {list.length - 3} autre(s)</span>}
                  {list.length === 0 && <span className="muted small">Aucune carte</span>}
                </div>
              );
            })}
          </div>
        </section>
      )}
    </>
  );
}