import Comment from "../models/Comment.js";
import Task from "../models/Task.js";
import { getProjectForUser } from "../utils/access.js";
import { notifyUser } from "../utils/notify.js";
import { getIO } from "../socket.js";

export const getComments = async (req, res) => {
  try {
    const task = await Task.findById(req.params.taskId);
    if (!task) return res.status(404).json({ message: "Tâche introuvable" });
    if (!(await getProjectForUser(task.project, req.user._id))) {
      return res.status(403).json({ message: "Accès refusé" });
    }
    const comments = await Comment.find({ task: task._id })
      .populate("user", "name")
      .sort({ createdAt: 1 });
    res.json(comments);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const addComment = async (req, res) => {
  try {
    const { text } = req.body;
    if (!text?.trim()) return res.status(400).json({ message: "Texte requis" });

    const task = await Task.findById(req.params.taskId);
    if (!task) return res.status(404).json({ message: "Tâche introuvable" });
    const project = await getProjectForUser(task.project, req.user._id);
    if (!project) return res.status(403).json({ message: "Accès refusé" });

    const comment = await Comment.create({ task: task._id, user: req.user._id, text });
    await comment.populate("user", "name");

    getIO().to(String(project._id)).emit("commentAdded", { taskId: task._id, comment });

    if (task.assignedTo && !task.assignedTo.equals(req.user._id)) {
      await notifyUser(
        task.assignedTo,
        `${req.user.name} a commenté « ${task.title} »`,
        project._id
      );
    }
    res.status(201).json(comment);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};