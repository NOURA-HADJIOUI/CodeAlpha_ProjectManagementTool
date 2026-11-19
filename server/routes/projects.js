import express from "express";
import {
  createProject, getProjects, getProject, addMember,
  addColumn, renameColumn, deleteColumn, deleteProject,
} from "../controllers/projectController.js";
import { protect } from "../middleware/auth.js";

const router = express.Router();
router.use(protect);

router.route("/").get(getProjects).post(createProject);
router.route("/:id").get(getProject).delete(deleteProject);
router.post("/:id/members", addMember);
router.post("/:id/columns", addColumn);
router.route("/:id/columns/:key").put(renameColumn).delete(deleteColumn);

export default router;