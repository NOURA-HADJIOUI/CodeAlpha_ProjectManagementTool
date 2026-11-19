import { useState } from "react";
import CommentList from "./CommentList";
import { LABEL_COLORS, PRIORITIES, textOn, toInputDate } from "../utils/helpers";
import Icon from "./Icon";

export default function TaskModal({ task, columns, members, socket, onClose, onSave, onDelete }) {
  const [title, setTitle] = useState(task.title);
  const [description, setDescription] = useState(task.description || "");
  const [labelText, setLabelText] = useState("");
  const [labelColor, setLabelColor] = useState(LABEL_COLORS[0]);
  const [newItem, setNewItem] = useState("");

  const labels = task.labels || [];
  const checklist = task.checklist || [];
  const doneCount = checklist.filter((c) => c.done).length;
  const pct = checklist.length ? Math.round((doneCount * 100) / checklist.length) : 0;
  const columnTitle = columns.find((c) => c.key === task.status)?.title;

  const saveTitle = () => {
    if (title.trim() && title.trim() !== task.title) onSave({ title: title.trim() });
    else setTitle(task.title);
  };

  const saveDescription = () => {
    if (description !== (task.description || "")) onSave({ description });
  };

  const addLabel = (e) => {
    e.preventDefault();
    if (!labelText.trim()) return;
    onSave({ labels: [...labels, { text: labelText.trim(), color: labelColor }] });
    setLabelText("");
  };

  const addItem = (e) => {
    e.preventDefault();
    if (!newItem.trim()) return;
    onSave({ checklist: [...checklist, { text: newItem.trim(), done: false }] });
    setNewItem("");
  };

  const toggleItem = (i) =>
    onSave({ checklist: checklist.map((c, j) => (j === i ? { ...c, done: !c.done } : c)) });

  const removeItem = (i) => onSave({ checklist: checklist.filter((_, j) => j !== i) });

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal modal-lg" onClick={(e) => e.stopPropagation()}>
        <button className="close" onClick={onClose} aria-label="Fermer"><Icon name="close" size={20} /></button>

        <div>
          <input
            className="title-input"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onBlur={saveTitle}
          />
          <p className="muted small">dans la liste « {columnTitle} »</p>
        </div>

        <div className="modal-grid">
          <div className="modal-main">
            <h4>Étiquettes</h4>
            <div className="label-row">
              {labels.map((l, i) => (
                <span
                  key={i}
                  className="label removable"
                  style={{ background: l.color, color: textOn(l.color) }}
                  title="Cliquer pour retirer"
                  onClick={() => onSave({ labels: labels.filter((_, j) => j !== i) })}
                >
                  {l.text} ×
                </span>
              ))}
              {labels.length === 0 && <span className="muted small">Aucune étiquette</span>}
            </div>
            <form className="inline-form" onSubmit={addLabel}>
              <input placeholder="Nouvelle étiquette" value={labelText} onChange={(e) => setLabelText(e.target.value)} />
              <div className="swatches">
                {LABEL_COLORS.map((c) => (
                  <button
                    type="button"
                    key={c}
                    className={`swatch ${labelColor === c ? "active" : ""}`}
                    style={{ background: c }}
                    onClick={() => setLabelColor(c)}
                    aria-label={`Couleur ${c}`}
                  />
                ))}
              </div>
              <button className="btn secondary" type="submit">Ajouter</button>
            </form>

            <h4>Description</h4>
            <textarea
              rows={4}
              placeholder="Ajouter une description plus détaillée..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              onBlur={saveDescription}
            />

            <h4>
              Checklist {checklist.length > 0 && <span className="muted small">{pct}%</span>}
            </h4>
            {checklist.length > 0 && (
              <div className="progress"><div style={{ width: `${pct}%` }} /></div>
            )}
            {checklist.map((c, i) => (
              <div key={i} className="check-item">
                <input type="checkbox" checked={c.done} onChange={() => toggleItem(i)} />
                <span className={c.done ? "done" : ""}>{c.text}</span>
                <button className="icon-btn" onClick={() => removeItem(i)} aria-label="Retirer"><Icon name="close" size={14} /></button>.
              </div>
            ))}
            <form className="inline-form" onSubmit={addItem}>
              <input placeholder="Ajouter un élément..." value={newItem} onChange={(e) => setNewItem(e.target.value)} />
              <button className="btn secondary" type="submit">Ajouter</button>
            </form>

            <h4>Commentaires</h4>
            <CommentList taskId={task._id} socket={socket} />
          </div>

          <aside className="modal-side">
            <label>Liste</label>
            <select value={task.status} onChange={(e) => onSave({ status: e.target.value })}>
              {columns.map((c) => (
                <option key={c.key} value={c.key}>{c.title}</option>
              ))}
            </select>

            <label>Assignée à</label>
            <select value={task.assignedTo?._id || ""} onChange={(e) => onSave({ assignedTo: e.target.value })}>
              <option value="">Non assignée</option>
              {members.map((m) => (
                <option key={m._id} value={m._id}>{m.name}</option>
              ))}
            </select>

            <label>Priorité</label>
            <select value={task.priority || "none"} onChange={(e) => onSave({ priority: e.target.value })}>
              {Object.entries(PRIORITIES).map(([k, p]) => (
                <option key={k} value={k}>{p.label}</option>
              ))}
            </select>

            <label>Échéance</label>
            <input
              type="date"
              value={toInputDate(task.dueDate)}
              onChange={(e) => onSave({ dueDate: e.target.value || null })}
            />

            <button className="btn danger" onClick={onDelete}>Supprimer la carte</button>
          </aside>
        </div>
      </div>
    </div>
  );
}