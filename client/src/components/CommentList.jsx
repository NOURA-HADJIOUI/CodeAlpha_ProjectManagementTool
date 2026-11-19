import { useEffect, useState } from "react";
import api from "../api/axios";

export default function CommentList({ taskId, socket }) {
  const [comments, setComments] = useState([]);
  const [text, setText] = useState("");

  useEffect(() => {
    api.get(`/comments/task/${taskId}`).then((r) => setComments(r.data)).catch(() => {});
  }, [taskId]);

  useEffect(() => {
    if (!socket) return;
    const handler = ({ taskId: tid, comment }) => {
      if (tid !== taskId) return;
      setComments((p) => (p.some((c) => c._id === comment._id) ? p : [...p, comment]));
    };
    socket.on("commentAdded", handler);
    return () => socket.off("commentAdded", handler);
  }, [socket, taskId]);

  const submit = async (e) => {
    e.preventDefault();
    if (!text.trim()) return;
    try {
      const { data } = await api.post(`/comments/task/${taskId}`, { text });
      setComments((p) => (p.some((c) => c._id === data._id) ? p : [...p, data]));
      setText("");
    } catch {
      /* ignore */
    }
  };

  return (
    <div>
      <div className="comments">
        {comments.map((c) => (
          <div key={c._id} className="comment">
            <strong>{c.user?.name}</strong>
            <span className="muted small"> · {new Date(c.createdAt).toLocaleString("fr-FR")}</span>
            <p>{c.text}</p>
          </div>
        ))}
        {comments.length === 0 && <p className="muted small">Aucun commentaire.</p>}
      </div>
      <form className="inline-form" onSubmit={submit}>
        <input placeholder="Écrire un commentaire..." value={text} onChange={(e) => setText(e.target.value)} />
        <button className="btn secondary" type="submit">Envoyer</button>
      </form>
    </div>
  );
}