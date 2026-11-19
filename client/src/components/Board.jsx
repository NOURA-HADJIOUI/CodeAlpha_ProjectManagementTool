import { useState } from "react";
import { DragDropContext } from "@hello-pangea/dnd";
import Column from "./Column";
import Icon from "./Icon";

export default function Board({
  columns, tasks, dragDisabled, onMove, onOpen,
  onAddTask, onAddColumn, onRenameColumn, onDeleteColumn,
}) {
  const [adding, setAdding] = useState(false);
  const [title, setTitle] = useState("");
  const doneKey = columns[columns.length - 1]?.key;

  const handleDragEnd = ({ destination, source, draggableId }) => {
    if (!destination) return;
    if (destination.droppableId === source.droppableId && destination.index === source.index) return;
    onMove(draggableId, destination.droppableId, destination.index);
  };

  const submit = (e) => {
    e.preventDefault();
    if (!title.trim()) return;
    onAddColumn(title.trim());
    setTitle("");
    setAdding(false);
  };

  return (
    <DragDropContext onDragEnd={handleDragEnd}>
      <div className="board">
        {columns.map((col) => (
          <Column
            key={col.key + col.title}
            column={col}
            tasks={tasks.filter((t) => t.status === col.key).sort((a, b) => a.position - b.position)}
            doneKey={doneKey}
            dragDisabled={dragDisabled}
            canDelete={columns.length > 1}
            onOpen={onOpen}
            onAddTask={(t) => onAddTask(col.key, t)}
            onRename={(t) => onRenameColumn(col.key, t)}
            onDelete={() => onDeleteColumn(col.key)}
          />
        ))}

        <div className="add-column">
          {adding ? (
            <form className="column add-card-form" onSubmit={submit}>
              <input autoFocus placeholder="Titre de la liste..." value={title} onChange={(e) => setTitle(e.target.value)} />
              <div className="row">
                <button className="btn" type="submit">Ajouter la liste</button>
                <button className="btn secondary" type="button" onClick={() => setAdding(false)} aria-label="Annuler">
                  <Icon name="close" size={16} />
                </button>
              </div>
            </form>
          ) : (
            <button className="add-column-btn" onClick={() => setAdding(true)}>
              <Icon name="plus" size={16} /> Ajouter une liste
            </button>
          )}
        </div>
      </div>
    </DragDropContext>
  );
}