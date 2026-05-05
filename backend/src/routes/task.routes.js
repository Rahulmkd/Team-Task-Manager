import { Router } from "express";
import {
  getTasks,
  getMyTasks,
  getTask,
  createTask,
  updateTask,
  deleteTask,
} from "../controllers/task.controller.js";
import { authenticate } from "../middleware/auth.middleware.js";

const router = Router();

router.use(authenticate);

router.get("/my", getMyTasks);
router.get("/", getTasks);
router.get("/:taskId", getTask);
router.post("/", createTask);
router.put("/:taskId", updateTask);
router.delete("/:taskId", deleteTask);

export default router;
