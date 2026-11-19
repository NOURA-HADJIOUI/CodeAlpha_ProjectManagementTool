import express from "express";
import { getTasks, createTask, updateTask, deleteTask } from "../controllers/taskController.js";
import { protect } from "../middleware/auth.js";

const router = express.Router();
router.use(protect);

router.post("/", createTask);
router.get("/project/:projectId", getTasks);
router.route("/:id").put(updateTask).delete(deleteTask);

export default router;