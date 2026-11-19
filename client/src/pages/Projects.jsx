import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import api from "../api/axios";
import { useAuth } from "../context/AuthContext";
import Avatar from "../components/Avatar";
import Icon from "../components/Icon";

export default function Projects() {
  const { user } = useAuth();
  const [params] = useSearchParams();
  const q = (params.get("q") || "").toLowerCase();
  const [projects, setProjects] = useState([]);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    api.get("/projects").then((r) => setProjects(r.data)).catch(() => setError("Impossible de charger les projets"));
  }, []);

  const create = async (e) => {
    e.preventDefault();
    try {
      const { data } = await api.post("/projects", { name, description });
      setProjects((p) => [{ ...data, members: [{ _id: user.id, name: user.name }] }, ...p]);
      setName("");
      setDescription("");
    } catch (err) {
      setError(err.response?.data?.message || "Erreur");
    }
  };

  const remove = async (e, p) => {
    e.preventDefault();
    e.stopPropagation();
    if (!window.confirm(`Supprimer le projet « ${p.name} » et toutes ses cartes ?`)) return;
    try {
      await api.delete(`/projects/${p._id}`);
      setProjects((list) => list.filter((x) => x._id !== p._id));
    } catch (err) {
      setError(err.response?.data?.message || "Erreur");
    }
  };

  const shown = projects.filter((p) => !q || p.name.toLowerCase().includes(q));

  return (
    <>
      <h2 className="page-title">Projets</h2>
      {error && <p className="error">{error}</p>}

      <form className="panel inline-form" onSubmit={create}>
        <input placeholder="Nom du projet" value={name} onChange={(e) => setName(e.target.value)} required />
        <input placeholder="Description (optionnel)" value={description} onChange={(e) => setDescription(e.target.value)} />
        <button className="btn" type="submit"><Icon name="plus" size={16} /> Créer</button>
      </form>

      <div className="grid">
        {shown.map((p) => (
          <Link
            key={p._id}
            to={`/projects/${p._id}`}
            className="card project-card"
            style={{ borderTopColor: p.color || "#26658C" }}
          >
            <h3>{p.name}</h3>
            <p className="muted">{p.description || "Aucune description"}</p>
            <div className="project-foot">
              <div className="avatars">
                {(p.members || []).slice(0, 5).map((m) => (
                  <Avatar key={m._id} name={m.name} />
                ))}
              </div>
              {p.owner === user.id && (
                <button className="icon-btn" onClick={(e) => remove(e, p)} title="Supprimer le projet">
                  <Icon name="trash" size={16} />
                </button>
              )}
            </div>
          </Link>
        ))}
        {shown.length === 0 && <p className="muted">Aucun projet trouvé.</p>}
      </div>
    </>
  );
}