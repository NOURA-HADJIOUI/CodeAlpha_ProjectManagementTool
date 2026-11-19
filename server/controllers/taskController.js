
import Task from "../models/Task.js";
import Comment from "../models/Comment.js";
import { getProjectForUser } from "../utils/access.js";
import { notifyUser } from "../utils/notify.js";
import { getIO } from "../socket.js";

const emitToProject = (projectId, event, payload) =>
  getIO().to(String(projectId)).emit(event, payload);

const cleanLabels = (labels) =>
  Array.isArray(labels)
    ? labels
        .filter((l) => l?.text?.trim())
        .map((l) => ({ text: l.text.trim().slice(0, 30), color: l.color || "#54ACBF" }))
    : [];

const cleanChecklist = (items) =>
  Array.isArray(items)
    ? items
        .filter((i) => i?.text?.trim())
        .map((i) => ({ text: i.text.trim().slice(0, 200), done: !!i.done }))
    : [];

export const getTasks = async (req, res) => {
  try {
    const project = await getProjectForUser(req.params.projectId, req.user._id);
    if (!project) return res.status(404).json({ message: "Projet introuvable" });

    const tasks = await Task.find({ project: project._id })
      .populate("assignedTo", "name email")
      .sort({ position: 1, createdAt: 1 })
      .lean();

    const counts = await Comment.aggregate([
      { $match: { task: { $in: tasks.map((t) => t._id) } } },
      { $group: { _id: "$task", n: { $sum: 1 } } },
    ]);
    const byTask = Object.fromEntries(counts.map((c) => [String(c._id), c.n]));

    res.json(tasks.map((t) => ({ ...t, commentsCount: byTask[String(t._id)] || 0 })));
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const createTask = async (req, res) => {
  try {
    const { title, description, projectId, assignedTo, status, priority, dueDate } = req.body;
    if (!title?.trim() || !projectId) {
      return res.status(400).json({ message: "Titre et projet requis" });
    }
    const project = await getProjectForUser(projectId, req.user._id);
    if (!project) return res.status(404).json({ message: "Projet introuvable" });

    if (assignedTo && !project.members.some((m) => m.equals(assignedTo))) {
      return res.status(400).json({ message: "L'assigné n'est pas membre du projet" });
    }

    const columnKey = project.columns.some((c) => c.key === status)
      ? status
      : project.columns[0].key;
    const last = await Task.findOne({ project: project._id, status: columnKey }).sort({ position: -1 });

    const task = await Task.create({
      title: title.trim(),
      description,
      status: columnKey,
      priority: priority || "none",
      dueDate: dueDate || null,
      position: last ? last.position + 1000 : 1000,
      project: project._id,
      assignedTo: assignedTo || null,
      createdBy: req.user._id,
    });
    await task.populate("assignedTo", "name email");

    emitToProject(project._id, "taskCreated", task);
    if (assignedTo && !task.assignedTo._id.equals(req.user._id)) {
      await notifyUser(assignedTo, `Nouvelle tâche assignée : « ${task.title} »`, project._id);
    }
    res.status(201).json(task);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const updateTask = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ message: "Tâche introuvable" });
    const project = await getProjectForUser(task.project, req.user._id);
    if (!project) return res.status(403).json({ message: "Accès refusé" });

    const previousAssignee = task.assignedTo ? String(task.assignedTo) : null;
    const { title, description, status, assignedTo, priority, dueDate, labels, checklist, position } = req.body;

    if (typeof title === "string" && title.trim()) task.title = title.trim();
    if (description !== undefined) task.description = description;
    if (status !== undefined) {
      if (!project.columns.some((c) => c.key === status)) {
        return res.status(400).json({ message: "Liste invalide" });
      }
      task.status = status;
    }
    if (priority !== undefined) task.priority = priority;
    if (dueDate !== undefined) task.dueDate = dueDate || null;
    if (labels !== undefined) task.labels = cleanLabels(labels);
    if (checklist !== undefined) task.checklist = cleanChecklist(checklist);
    if (position !== undefined && Number.isFinite(position)) task.position = position;
    if (assignedTo !== undefined) {
      if (assignedTo && !project.members.some((m) => m.equals(assignedTo))) {
        return res.status(400).json({ message: "L'assigné n'est pas membre du projet" });
      }
      task.assignedTo = assignedTo || null;
    }

    await task.save();
    await task.populate("assignedTo", "name email");
    emitToProject(project._id, "taskUpdated", task);

    const newAssignee = task.assignedTo ? String(task.assignedTo._id) : null;
    if (newAssignee && newAssignee !== previousAssignee && newAssignee !== String(req.user._id)) {
      await notifyUser(newAssignee, `Tâche assignée : « ${task.title} »`, project._id);
    }
    res.json(task);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const deleteTask = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ message: "Tâche introuvable" });
    const project = await getProjectForUser(task.project, req.user._id);
    if (!project) return res.status(403).json({ message: "Accès refusé" });

    await Comment.deleteMany({ task: task._id });
    await task.deleteOne();
    emitToProject(project._id, "taskDeleted", { _id: task._id });
    res.json({ message: "Tâche supprimée" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};