import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Check if user is a member of the project (any role)
export const isProjectMember = async (req, res, next) => {
  try {
    const projectId = req.params.projectId || req.body.projectId;

    if (!projectId) {
      return res.status(400).json({ success: false, message: "Project ID is required." });
    }

    const membership = await prisma.projectMember.findUnique({
      where: { userId_projectId: { userId: req.user.id, projectId } },
    });

    if (!membership) {
      return res.status(403).json({ success: false, message: "Access denied. You are not a member of this project." });
    }

    req.membership = membership;
    next();
  } catch (err) {
    next(err);
  }
};

// Check if user is admin of the project
export const isProjectAdmin = async (req, res, next) => {
  try {
    const projectId = req.params.projectId || req.body.projectId;

    if (!projectId) {
      return res.status(400).json({ success: false, message: "Project ID is required." });
    }

    const membership = await prisma.projectMember.findUnique({
      where: { userId_projectId: { userId: req.user.id, projectId } },
    });

    if (!membership) {
      return res.status(403).json({ success: false, message: "Access denied. You are not a member of this project." });
    }

    if (membership.role !== "ADMIN") {
      return res.status(403).json({ success: false, message: "Access denied. Admin privileges required." });
    }

    req.membership = membership;
    next();
  } catch (err) {
    next(err);
  }
};
