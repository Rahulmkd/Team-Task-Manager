import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// GET /api/dashboard - Get dashboard stats for current user
export const getDashboard = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const now = new Date();

    // Get all project IDs the user is a member of
    const userMemberships = await prisma.projectMember.findMany({
      where: { userId },
      select: { projectId: true, role: true },
    });

    const projectIds = userMemberships.map((m) => m.projectId);

    if (projectIds.length === 0) {
      return res.json({
        success: true,
        data: {
          totalProjects: 0,
          totalTasks: 0,
          tasksByStatus: { TODO: 0, IN_PROGRESS: 0, DONE: 0 },
          tasksByPriority: { LOW: 0, MEDIUM: 0, HIGH: 0, URGENT: 0 },
          overdueTasks: 0,
          myAssignedTasks: 0,
          myOverdueTasks: 0,
          tasksPerUser: [],
          recentTasks: [],
          projectSummaries: [],
        },
      });
    }

    // Total tasks across all user's projects
    const totalTasks = await prisma.task.count({
      where: { projectId: { in: projectIds } },
    });

    // Tasks by status
    const tasksByStatusRaw = await prisma.task.groupBy({
      by: ["status"],
      where: { projectId: { in: projectIds } },
      _count: { status: true },
    });
    const tasksByStatus = { TODO: 0, IN_PROGRESS: 0, DONE: 0 };
    tasksByStatusRaw.forEach((t) => { tasksByStatus[t.status] = t._count.status; });

    // Tasks by priority
    const tasksByPriorityRaw = await prisma.task.groupBy({
      by: ["priority"],
      where: { projectId: { in: projectIds } },
      _count: { priority: true },
    });
    const tasksByPriority = { LOW: 0, MEDIUM: 0, HIGH: 0, URGENT: 0 };
    tasksByPriorityRaw.forEach((t) => { tasksByPriority[t.priority] = t._count.priority; });

    // Overdue tasks (due date in past, not done)
    const overdueTasks = await prisma.task.count({
      where: {
        projectId: { in: projectIds },
        dueDate: { lt: now },
        status: { not: "DONE" },
      },
    });

    // My assigned tasks
    const myAssignedTasks = await prisma.task.count({
      where: { assigneeId: userId },
    });

    // My overdue tasks
    const myOverdueTasks = await prisma.task.count({
      where: {
        assigneeId: userId,
        dueDate: { lt: now },
        status: { not: "DONE" },
      },
    });

    // Tasks per user (across all shared projects)
    const tasksPerUserRaw = await prisma.task.groupBy({
      by: ["assigneeId"],
      where: {
        projectId: { in: projectIds },
        assigneeId: { not: null },
      },
      _count: { assigneeId: true },
    });

    const assigneeIds = tasksPerUserRaw.map((t) => t.assigneeId).filter(Boolean);
    const assignees = await prisma.user.findMany({
      where: { id: { in: assigneeIds } },
      select: { id: true, name: true, email: true },
    });

    const tasksPerUser = tasksPerUserRaw.map((t) => {
      const user = assignees.find((u) => u.id === t.assigneeId);
      return { user, count: t._count.assigneeId };
    }).filter((t) => t.user);

    // Recent tasks
    const recentTasks = await prisma.task.findMany({
      where: { projectId: { in: projectIds } },
      include: {
        assignee: { select: { id: true, name: true } },
        project: { select: { id: true, name: true } },
      },
      orderBy: { updatedAt: "desc" },
      take: 8,
    });

    // Project summaries
    const projectSummaries = await Promise.all(
      projectIds.map(async (projectId) => {
        const project = await prisma.project.findUnique({
          where: { id: projectId },
          select: { id: true, name: true },
        });

        const taskStats = await prisma.task.groupBy({
          by: ["status"],
          where: { projectId },
          _count: { status: true },
        });

        const stats = { TODO: 0, IN_PROGRESS: 0, DONE: 0 };
        taskStats.forEach((t) => { stats[t.status] = t._count.status; });
        const total = stats.TODO + stats.IN_PROGRESS + stats.DONE;

        const membership = userMemberships.find((m) => m.projectId === projectId);

        return {
          ...project,
          userRole: membership?.role,
          taskStats: stats,
          totalTasks: total,
          progress: total > 0 ? Math.round((stats.DONE / total) * 100) : 0,
        };
      })
    );

    res.json({
      success: true,
      data: {
        totalProjects: projectIds.length,
        totalTasks,
        tasksByStatus,
        tasksByPriority,
        overdueTasks,
        myAssignedTasks,
        myOverdueTasks,
        tasksPerUser,
        recentTasks,
        projectSummaries,
      },
    });
  } catch (err) {
    next(err);
  }
};
