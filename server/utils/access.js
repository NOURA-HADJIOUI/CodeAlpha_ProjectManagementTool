import Project from "../models/Project.js";

export const getProjectForUser = async (projectId, userId) => {
  const project = await Project.findById(projectId);
  if (!project) return null;
  return project.members.some((m) => m.equals(userId)) ? project : null;
};