export const LABEL_COLORS = ["#7053c1", "#c94c58", "#a95f00", "#27805e", "#26658C", "#523f7a"];

export const PRIORITIES = {
  none: { label: "Aucune" },
  low: { label: "Basse", color: "#54ACBF" },
  medium: { label: "Moyenne", color: "#e0a030" },
  high: { label: "Haute", color: "#c0392b" },
};

export const textOn = (hex) => (hex === "#A7EBF2" ? "#023859" : "#ffffff");

export const isOverdue = (task, doneKey) =>
  !!task.dueDate &&
  task.status !== doneKey &&
  new Date(task.dueDate).getTime() + 86400000 < Date.now();

export const fmtDate = (d) =>
  new Date(d).toLocaleDateString("fr-FR", { day: "numeric", month: "short", timeZone: "UTC" });

export const toInputDate = (d) => (d ? new Date(d).toISOString().slice(0, 10) : "");