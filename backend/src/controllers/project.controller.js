import { PrismaClient } from "@prisma/client";
import {
  createProjectSchema,
  updateProjectSchema,
  addMemberSchema,
  updateMemberRoleSchema,
} from "../validators/project.validator.js";

const prisma = new PrismaClient();

// GET /api/projects - Get all projects for the current user
export const getProjects = async (req, res, next) => {
  try {
    const projectMembers = await prisma.projectMember.findMany({
      where: { userId: req.user.id },
      include: {
        project: {
          include: {
            _count: { select: { tasks: true, members: true } },
            members: {
              include: { user: { select: { id: true, name: true, email: true } } },
            },
          },
        },
      },
      orderBy: { joinedAt: "desc" },
    });

    const projects = projectMembers.map((pm) => ({
      ...pm.project,
      userRole: pm.role,
    }));

    res.json({ success: true, data: { projects } });
  } catch (err) {
    next(err);
  }
};

// GET /api/projects/:projectId - Get single project details
export const getProject = async (req, res, next) => {
  try {
    const { projectId } = req.params;

    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: {
        members: {
          include: {
            user: { select: { id: true, name: true, email: true } },
          },
          orderBy: { joinedAt: "asc" },
        },
        tasks: {
          include: {
            assignee: { select: { id: true, name: true, email: true } },
            creator: { select: { id: true, name: true, email: true } },
          },
          orderBy: { createdAt: "desc" },
        },
        _count: { select: { tasks: true, members: true } },
      },
    });

    if (!project) {
      return res.status(404).json({ success: false, message: "Project not found." });
    }

    // Attach user's role
    const userMembership = project.members.find((m) => m.userId === req.user.id);
    const projectWithRole = { ...project, userRole: userMembership?.role };

    res.json({ success: true, data: { project: projectWithRole } });
  } catch (err) {
    next(err);
  }
};

// POST /api/projects - Create a new project
export const createProject = async (req, res, next) => {
  try {
    const validated = createProjectSchema.parse(req.body);

    const project = await prisma.project.create({
      data: {
        name: validated.name,
        description: validated.description,
        members: {
          create: {
            userId: req.user.id,
            role: "ADMIN",
          },
        },
      },
      include: {
        members: {
          include: { user: { select: { id: true, name: true, email: true } } },
        },
        _count: { select: { tasks: true, members: true } },
      },
    });

    res.status(201).json({
      success: true,
      message: "Project created successfully.",
      data: { project: { ...project, userRole: "ADMIN" } },
    });
  } catch (err) {
    next(err);
  }
};

// PUT /api/projects/:projectId - Update project (Admin only)
export const updateProject = async (req, res, next) => {
  try {
    const { projectId } = req.params;
    const validated = updateProjectSchema.parse(req.body);

    const project = await prisma.project.update({
      where: { id: projectId },
      data: validated,
      include: {
        members: {
          include: { user: { select: { id: true, name: true, email: true } } },
        },
        _count: { select: { tasks: true, members: true } },
      },
    });

    res.json({
      success: true,
      message: "Project updated successfully.",
      data: { project: { ...project, userRole: "ADMIN" } },
    });
  } catch (err) {
    next(err);
  }
};

// DELETE /api/projects/:projectId - Delete project (Admin only)
export const deleteProject = async (req, res, next) => {
  try {
    const { projectId } = req.params;

    await prisma.project.delete({ where: { id: projectId } });

    res.json({ success: true, message: "Project deleted successfully." });
  } catch (err) {
    next(err);
  }
};

// POST /api/projects/:projectId/members - Add member to project (Admin only)
export const addMember = async (req, res, next) => {
  try {
    const { projectId } = req.params;
    const validated = addMemberSchema.parse(req.body);

    // Find user by email
    const userToAdd = await prisma.user.findUnique({
      where: { email: validated.email },
      select: { id: true, name: true, email: true },
    });

    if (!userToAdd) {
      return res.status(404).json({ success: false, message: "User with this email not found." });
    }

    // Check if already a member
    const existingMembership = await prisma.projectMember.findUnique({
      where: { userId_projectId: { userId: userToAdd.id, projectId } },
    });

    if (existingMembership) {
      return res.status(409).json({ success: false, message: "User is already a member of this project." });
    }

    const membership = await prisma.projectMember.create({
      data: { userId: userToAdd.id, projectId, role: validated.role },
      include: { user: { select: { id: true, name: true, email: true } } },
    });

    res.status(201).json({
      success: true,
      message: `${userToAdd.name} added to the project.`,
      data: { member: membership },
    });
  } catch (err) {
    next(err);
  }
};

// PUT /api/projects/:projectId/members/:memberId - Update member role (Admin only)
export const updateMemberRole = async (req, res, next) => {
  try {
    const { projectId, memberId } = req.params;
    const validated = updateMemberRoleSchema.parse(req.body);

    // Prevent admin from demoting themselves if they're the only admin
    const adminCount = await prisma.projectMember.count({
      where: { projectId, role: "ADMIN" },
    });

    const memberToUpdate = await prisma.projectMember.findUnique({
      where: { id: memberId },
    });

    if (!memberToUpdate) {
      return res.status(404).json({ success: false, message: "Member not found." });
    }

    if (memberToUpdate.userId === req.user.id && memberToUpdate.role === "ADMIN" && adminCount === 1 && validated.role === "MEMBER") {
      return res.status(400).json({
        success: false,
        message: "Cannot demote the only admin. Promote another member first.",
      });
    }

    const updatedMember = await prisma.projectMember.update({
      where: { id: memberId },
      data: { role: validated.role },
      include: { user: { select: { id: true, name: true, email: true } } },
    });

    res.json({
      success: true,
      message: "Member role updated.",
      data: { member: updatedMember },
    });
  } catch (err) {
    next(err);
  }
};

// DELETE /api/projects/:projectId/members/:memberId - Remove member (Admin only)
export const removeMember = async (req, res, next) => {
  try {
    const { projectId, memberId } = req.params;

    const membership = await prisma.projectMember.findUnique({
      where: { id: memberId },
      include: { user: { select: { name: true } } },
    });

    if (!membership) {
      return res.status(404).json({ success: false, message: "Member not found." });
    }

    // Prevent removing the last admin
    if (membership.role === "ADMIN") {
      const adminCount = await prisma.projectMember.count({
        where: { projectId, role: "ADMIN" },
      });
      if (adminCount === 1) {
        return res.status(400).json({
          success: false,
          message: "Cannot remove the only admin. Transfer ownership first.",
        });
      }
    }

    // Unassign tasks from this user in this project
    await prisma.task.updateMany({
      where: { projectId, assigneeId: membership.userId },
      data: { assigneeId: null },
    });

    await prisma.projectMember.delete({ where: { id: memberId } });

    res.json({
      success: true,
      message: `${membership.user.name} removed from the project.`,
    });
  } catch (err) {
    next(err);
  }
};

// POST /api/projects/:projectId/leave - Leave a project
export const leaveProject = async (req, res, next) => {
  try {
    const { projectId } = req.params;

    const membership = await prisma.projectMember.findUnique({
      where: { userId_projectId: { userId: req.user.id, projectId } },
    });

    if (!membership) {
      return res.status(404).json({ success: false, message: "You are not a member of this project." });
    }

    if (membership.role === "ADMIN") {
      const adminCount = await prisma.projectMember.count({
        where: { projectId, role: "ADMIN" },
      });
      if (adminCount === 1) {
        return res.status(400).json({
          success: false,
          message: "Cannot leave as the only admin. Transfer ownership first.",
        });
      }
    }

    // Unassign tasks
    await prisma.task.updateMany({
      where: { projectId, assigneeId: req.user.id },
      data: { assigneeId: null },
    });

    await prisma.projectMember.delete({
      where: { userId_projectId: { userId: req.user.id, projectId } },
    });

    res.json({ success: true, message: "Left project successfully." });
  } catch (err) {
    next(err);
  }
};
