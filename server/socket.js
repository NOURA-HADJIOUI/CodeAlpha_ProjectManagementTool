import { Server } from "socket.io";

let io;

export const initSocket = (httpServer) => {
  io = new Server(httpServer, {
    cors: { origin: "http://localhost:5173" },
  });

  io.on("connection", (socket) => {
    socket.on("joinProject", (projectId) => socket.join(projectId));
    socket.on("leaveProject", (projectId) => socket.leave(projectId));
    socket.on("joinUser", (userId) => socket.join(`user:${userId}`));
  });

  return io;
};

export const getIO = () => io;