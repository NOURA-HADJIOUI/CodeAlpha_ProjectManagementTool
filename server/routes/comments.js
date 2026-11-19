import express from "express";
import { getComments, addComment } from "../controllers/commentController.js";
import { protect } from "../middleware/auth.js";

const router = express.Router();
router.use(protect);

router.route("/task/:taskId").get(getComments).post(addComment);

export default router;