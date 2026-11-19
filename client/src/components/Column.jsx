import { useState } from "react";
import { Droppable } from "@hello-pangea/dnd";
import TaskCard from "./TaskCard";
import Icon from "./Icon";

export default function Column({
  column, tasks, doneKey, dragDisabled, canDelete,
  onOpen, onAddTask, onRename, onDelete,
}) {
  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState(column.title);
  const [adding, setAdding] = useState(false);
  const [newTitle, setNewTitle] = useState("");

  const saveTitle = () => {
    setEditing(false);
    if (title.trim() && title.trim() !== column.title) onRename(title.trim());
    else setTitle(column.title);
  };

  const submitCard = (e) => {
    e.preventDefault();
    if (!newTitle.trim()) return;
    onAddTask(newTitle.trim());
    setNewTitle("");
  };

  return (
    <div className="column">
      <div className="column-head">
        {editing ? (
          <input
            autoFocus
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onBlur={saveTitle}
            onKeyDown={(e) => e.key === "Enter" && saveTitle()}
          />
        ) : (
          <h3 onClick={() => setEditing(true)} title="Cliquer pour renommer">{column.title}</h3>
        )}
        <span className="count">{tasks.length}</span>
        {canDelete && (
          <button className="icon-btn" onClick={onDelete} title="Supprimer la liste">
            <Icon name="trash" size={16} />
          </button>
        )}
      </div>

      <Droppable droppableId={column.key}>
        {(provided, snapshot) => (
          <div
            ref={provided.innerRef}
            {...provided.droppableProps}
            className={`column-body ${snapshot.isDraggingOver ? "over" : ""}`}
          >
            {tasks.map((t, i) => (
              <TaskCard key={t._id} task={t} index={i} onOpen={onOpen} doneKey={doneKey} dragDisabled={dragDisabled} />
            ))}
            {provided.placeholder}
          </div>
        )}
      </Droppable>

      {adding ? (
        <form className="add-card-form" onSubmit={submitCard}>
          <input autoFocus placeholder="Titre de la carte..." value={newTitle} onChange={(e) => setNewTitle(e.target.value)} />
          <div className="row">
            <button className="btn" type="submit">Ajouter</button>
            <button className="btn secondary" type="button" onClick={() => setAdding(false)} aria-label="Annuler">
              <Icon name="close" size={16} />
            </button>
          </div>
        </form>
      ) : (
        <button className="add-card-btn" onClick={() => setAdding(true)}>
          <Icon name="plus" size={16} /> Ajouter une carte
        </button>
      )}
    </div>
  );
}