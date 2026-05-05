import { Router } from "express";
import {
  getProjects,
  getProject,
  createProject,
  updateProject,
  deleteProject,
  addMember,
  updateMemberRole,
  removeMember,
  leaveProject,
} from "../controllers/project.controller.js";
import { authenticate } from "../middleware/auth.middleware.js";
import { isProjectMember, isProjectAdmin } from "../middleware/role.middleware.js";

const router = Router();

// All routes require authentication
router.use(authenticate);

router.get("/", getProjects);
router.post("/", createProject);

router.get("/:projectId", isProjectMember, getProject);
router.put("/:projectId", isProjectAdmin, updateProject);
router.delete("/:projectId", isProjectAdmin, deleteProject);

// Member management (Admin only)
router.post("/:projectId/members", isProjectAdmin, addMember);
router.put("/:projectId/members/:memberId", isProjectAdmin, updateMemberRole);
router.delete("/:projectId/members/:memberId", isProjectAdmin, removeMember);

// Leave project (any member)
router.post("/:projectId/leave", isProjectMember, leaveProject);

export default router;
