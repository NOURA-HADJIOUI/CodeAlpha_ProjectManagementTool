import { Draggable } from "@hello-pangea/dnd";
import Avatar from "./Avatar";
import Icon from "./Icon";
import { PRIORITIES, textOn, isOverdue, fmtDate } from "../utils/helpers";

export default function TaskCard({ task, index, onOpen, doneKey, dragDisabled }) {
  const total = task.checklist?.length || 0;
  const done = task.checklist?.filter((c) => c.done).length || 0;
  const overdue = isOverdue(task, doneKey);
  const prio = PRIORITIES[task.priority];

  return (
    <Draggable draggableId={task._id} index={index} isDragDisabled={dragDisabled}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          className={`task-card ${snapshot.isDragging ? "dragging" : ""}`}
          onClick={() => onOpen(task._id)}
        >
          {task.labels?.length > 0 && (
            <div className="label-row">
              {task.labels.map((l, i) => (
                <span key={i} className="label" style={{ background: l.color, color: textOn(l.color) }}>
                  {l.text}
                </span>
              ))}
            </div>
          )}

          <strong>{task.title}</strong>

          <div className="card-meta">
            {prio && task.priority !== "none" && (
              <span className="chip" style={{ borderColor: prio.color, color: prio.color }}>
                <Icon name="flag" size={12} /> {prio.label}
              </span>
            )}
            {task.dueDate && (
              <span className={`chip ${overdue ? "overdue" : ""}`}>
                <Icon name="clock" size={12} /> {fmtDate(task.dueDate)}
              </span>
            )}
            {task.description && (
              <span className="chip" title="Description"><Icon name="lines" size={12} /></span>
            )}
            {total > 0 && (
              <span className={`chip ${done === total ? "complete" : ""}`}>
                <Icon name="checklist" size={12} /> {done}/{total}
              </span>
            )}
            {task.commentsCount > 0 && (
              <span className="chip"><Icon name="comment" size={12} /> {task.commentsCount}</span>
            )}
            {task.assignedTo && (
              <span className="card-avatar"><Avatar name={task.assignedTo.name} /></span>
            )}
          </div>
        </div>
      )}
    </Draggable>
  );
}