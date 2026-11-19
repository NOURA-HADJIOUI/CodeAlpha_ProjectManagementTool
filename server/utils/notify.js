import Notification from "../models/Notification.js";
import { getIO } from "../socket.js";

export const notifyUser = async (userId, message, projectId) => {
  const n = await Notification.create({ user: userId, message, project: projectId });
  getIO().to(`user:${userId}`).emit("notification", n);
};