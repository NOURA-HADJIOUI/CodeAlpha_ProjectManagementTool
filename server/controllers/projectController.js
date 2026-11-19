import Project from "../models/Project.js";
import Task from "../models/Task.js";
import Comment from "../models/Comment.js";
import User from "../models/User.js";
import { getProjectForUser } from "../utils/access.js";
import { notifyUser } from "../utils/notify.js";
import { getIO } from "../socket.js";

const emitProject = async (project) => {
  await project.populate("members", "name email");
  getIO().to(String(project._id)).emit("projectUpdated", project);
};

export const createProject = async (req, res) => {
  try {
    const { name, description, color } = req.body;
    if (!name) return res.status(400).json({ message: "Nom requis" });
    const project = await Project.create({
      name,
      description,
      color: color || "#26658C",
      owner: req.user._id,
      members: [req.user._id],
    });
    res.status(201).json(project);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const getProjects = async (req, res) => {
  try {
    const projects = await Project.find({ members: req.user._id })
      .populate("members", "name email")
      .sort({ createdAt: -1 });
    res.json(projects);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const getProject = async (req, res) => {
  try {
    const project = await getProjectForUser(req.params.id, req.user._id);
    if (!project) return res.status(404).json({ message: "Projet introuvable" });
    await project.populate("members", "name email");
    res.json(project);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const addMember = async (req, res) => {
  try {
    const project = await getProjectForUser(req.params.id, req.user._id);
    if (!project) return res.status(404).json({ message: "Projet introuvable" });

    const user = await User.findOne({ email: req.body.email?.toLowerCase() });
    if (!user) return res.status(404).json({ message: "Utilisateur introuvable" });
    if (project.members.some((m) => m.equals(user._id))) {
      return res.status(400).json({ message: "Déjà membre" });
    }

    project.members.push(user._id);
    await project.save();
    await notifyUser(user._id, `Tu as été ajouté au projet « ${project.name} »`, project._id);
    await emitProject(project);
    res.json(project);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const addColumn = async (req, res) => {
  try {
    const project = await getProjectForUser(req.params.id, req.user._id);
    if (!project) return res.status(404).json({ message: "Projet introuvable" });
    const title = req.body.title?.trim();
    if (!title) return res.status(400).json({ message: "Titre requis" });

    project.columns.push({ key: `col_${Date.now().toString(36)}`, title });
    await project.save();
    await emitProject(project);
    res.status(201).json(project);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const renameColumn = async (req, res) => {
  try {
    const project = await getProjectForUser(req.params.id, req.user._id);
    if (!project) return res.status(404).json({ message: "Projet introuvable" });
    const col = project.columns.find((c) => c.key === req.params.key);
    if (!col) return res.status(404).json({ message: "Liste introuvable" });
    const title = req.body.title?.trim();
    if (!title) return res.status(400).json({ message: "Titre requis" });

    col.title = title;
    await project.save();
    await emitProject(project);
    res.json(project);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const deleteColumn = async (req, res) => {
  try {
    const project = await getProjectForUser(req.params.id, req.user._id);
    if (!project) return res.status(404).json({ message: "Projet introuvable" });
    const { key } = req.params;
    if (!project.columns.some((c) => c.key === key)) {
      return res.status(404).json({ message: "Liste introuvable" });
    }
    if (project.columns.length <= 1) {
      return res.status(400).json({ message: "Il faut au moins une liste" });
    }

    project.columns = project.columns.filter((c) => c.key !== key);
    await Task.updateMany(
      { project: project._id, status: key },
      { status: project.columns[0].key }
    );
    await project.save();
    await emitProject(project);
    res.json(project);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const deleteProject = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) return res.status(404).json({ message: "Projet introuvable" });
    if (!project.owner.equals(req.user._id)) {
      return res.status(403).json({ message: "Seul le propriétaire peut supprimer" });
    }
    const tasks = await Task.find({ project: project._id }).select("_id");
    await Comment.deleteMany({ task: { $in: tasks.map((t) => t._id) } });
    await Task.deleteMany({ project: project._id });
    await project.deleteOne();
    res.json({ message: "Projet supprimé" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};