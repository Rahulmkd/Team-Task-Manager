import { PrismaClient } from "@prisma/client";
import { createTaskSchema, updateTaskSchema } from "../validators/task.validator.js";

const prisma = new PrismaClient();

// GET /api/tasks?projectId=xxx - Get tasks for a project
export const getTasks = async (req, res, next) => {
  try {
    const { projectId, status, priority, assigneeId } = req.query;

    if (!projectId) {
      return res.status(400).json({ success: false, message: "Project ID is required." });
    }

    // Verify user is a member
    const membership = await prisma.projectMember.findUnique({
      where: { userId_projectId: { userId: req.user.id, projectId } },
    });

    if (!membership) {
      return res.status(403).json({ success: false, message: "Access denied." });
    }

    const where = { projectId };
    if (status) where.status = status;
    if (priority) where.priority = priority;
    if (assigneeId) where.assigneeId = assigneeId;

    const tasks = await prisma.task.findMany({
      where,
      include: {
        assignee: { select: { id: true, name: true, email: true } },
        creator: { select: { id: true, name: true, email: true } },
        project: { select: { id: true, name: true } },
      },
      orderBy: [{ status: "asc" }, { priority: "desc" }, { createdAt: "desc" }],
    });

    res.json({ success: true, data: { tasks, userRole: membership.role } });
  } catch (err) {
    next(err);
  }
};

// GET /api/tasks/my - Get tasks assigned to current user across all projects
export const getMyTasks = async (req, res, next) => {
  try {
    const tasks = await prisma.task.findMany({
      where: { assigneeId: req.user.id },
      include: {
        project: { select: { id: true, name: true } },
        creator: { select: { id: true, name: true, email: true } },
      },
      orderBy: [{ dueDate: "asc" }, { priority: "desc" }],
    });

    res.json({ success: true, data: { tasks } });
  } catch (err) {
    next(err);
  }
};

// GET /api/tasks/:taskId - Get single task
export const getTask = async (req, res, next) => {
  try {
    const { taskId } = req.params;

    const task = await prisma.task.findUnique({
      where: { id: taskId },
      include: {
        assignee: { select: { id: true, name: true, email: true } },
        creator: { select: { id: true, name: true, email: true } },
        project: { select: { id: true, name: true } },
      },
    });

    if (!task) {
      return res.status(404).json({ success: false, message: "Task not found." });
    }

    // Verify user is a project member
    const membership = await prisma.projectMember.findUnique({
      where: { userId_projectId: { userId: req.user.id, projectId: task.projectId } },
    });

    if (!membership) {
      return res.status(403).json({ success: false, message: "Access denied." });
    }

    res.json({ success: true, data: { task, userRole: membership.role } });
  } catch (err) {
    next(err);
  }
};

// POST /api/tasks - Create a task (Admin only)
export const createTask = async (req, res, next) => {
  try {
    const validated = createTaskSchema.parse(req.body);

    // Verify user is admin of the project
    const membership = await prisma.projectMember.findUnique({
      where: { userId_projectId: { userId: req.user.id, projectId: validated.projectId } },
    });

    if (!membership) {
      return res.status(403).json({ success: false, message: "Access denied." });
    }

    if (membership.role !== "ADMIN") {
      return res.status(403).json({ success: false, message: "Only admins can create tasks." });
    }

    // Verify assignee is a project member
    if (validated.assigneeId) {
      const assigneeMembership = await prisma.projectMember.findUnique({
        where: { userId_projectId: { userId: validated.assigneeId, projectId: validated.projectId } },
      });
      if (!assigneeMembership) {
        return res.status(400).json({ success: false, message: "Assignee must be a project member." });
      }
    }

    const task = await prisma.task.create({
      data: {
        title: validated.title,
        description: validated.description,
        status: validated.status,
        priority: validated.priority,
        dueDate: validated.dueDate ? new Date(validated.dueDate) : null,
        projectId: validated.projectId,
        assigneeId: validated.assigneeId,
        creatorId: req.user.id,
      },
      include: {
        assignee: { select: { id: true, name: true, email: true } },
        creator: { select: { id: true, name: true, email: true } },
        project: { select: { id: true, name: true } },
      },
    });

    res.status(201).json({
      success: true,
      message: "Task created successfully.",
      data: { task },
    });
  } catch (err) {
    next(err);
  }
};

// PUT /api/tasks/:taskId - Update task
export const updateTask = async (req, res, next) => {
  try {
    const { taskId } = req.params;
    const validated = updateTaskSchema.parse(req.body);

    const task = await prisma.task.findUnique({ where: { id: taskId } });
    if (!task) {
      return res.status(404).json({ success: false, message: "Task not found." });
    }

    // Verify user is project member
    const membership = await prisma.projectMember.findUnique({
      where: { userId_projectId: { userId: req.user.id, projectId: task.projectId } },
    });

    if (!membership) {
      return res.status(403).json({ success: false, message: "Access denied." });
    }

    // Members can only update status of their own tasks
    if (membership.role === "MEMBER") {
      if (task.assigneeId !== req.user.id) {
        return res.status(403).json({
          success: false,
          message: "Members can only update their own assigned tasks.",
        });
      }
      // Members can only change status
      const allowedFields = ["status"];
      const hasDisallowedFields = Object.keys(validated).some((key) => !allowedFields.includes(key));
      if (hasDisallowedFields) {
        return res.status(403).json({
          success: false,
          message: "Members can only update the task status.",
        });
      }
    }

    // Admin: verify new assignee is a project member
    if (validated.assigneeId && membership.role === "ADMIN") {
      const assigneeMembership = await prisma.projectMember.findUnique({
        where: { userId_projectId: { userId: validated.assigneeId, projectId: task.projectId } },
      });
      if (!assigneeMembership) {
        return res.status(400).json({ success: false, message: "Assignee must be a project member." });
      }
    }

    const updateData = { ...validated };
    if (validated.dueDate !== undefined) {
      updateData.dueDate = validated.dueDate ? new Date(validated.dueDate) : null;
    }

    const updatedTask = await prisma.task.update({
      where: { id: taskId },
      data: updateData,
      include: {
        assignee: { select: { id: true, name: true, email: true } },
        creator: { select: { id: true, name: true, email: true } },
        project: { select: { id: true, name: true } },
      },
    });

    res.json({
      success: true,
      message: "Task updated successfully.",
      data: { task: updatedTask },
    });
  } catch (err) {
    next(err);
  }
};

// DELETE /api/tasks/:taskId - Delete task (Admin only)
export const deleteTask = async (req, res, next) => {
  try {
    const { taskId } = req.params;

    const task = await prisma.task.findUnique({ where: { id: taskId } });
    if (!task) {
      return res.status(404).json({ success: false, message: "Task not found." });
    }

    // Verify user is admin of the project
    const membership = await prisma.projectMember.findUnique({
      where: { userId_projectId: { userId: req.user.id, projectId: task.projectId } },
    });

    if (!membership || membership.role !== "ADMIN") {
      return res.status(403).json({ success: false, message: "Only admins can delete tasks." });
    }

    await prisma.task.delete({ where: { id: taskId } });

    res.json({ success: true, message: "Task deleted successfully." });
  } catch (err) {
    next(err);
  }
};
