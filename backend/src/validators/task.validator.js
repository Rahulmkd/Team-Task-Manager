import { z } from "zod";

export const createTaskSchema = z.object({
  title: z
    .string()
    .min(2, "Task title must be at least 2 characters")
    .max(150, "Task title must not exceed 150 characters")
    .trim(),
  description: z
    .string()
    .max(1000, "Description must not exceed 1000 characters")
    .trim()
    .optional(),
  status: z.enum(["TODO", "IN_PROGRESS", "DONE"]).default("TODO"),
  priority: z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"]).default("MEDIUM"),
  dueDate: z.string().datetime().optional().nullable(),
  assigneeId: z.string().cuid("Invalid assignee ID").optional().nullable(),
  projectId: z.string().cuid("Invalid project ID"),
});

export const updateTaskSchema = z.object({
  title: z
    .string()
    .min(2, "Task title must be at least 2 characters")
    .max(150, "Task title must not exceed 150 characters")
    .trim()
    .optional(),
  description: z
    .string()
    .max(1000, "Description must not exceed 1000 characters")
    .trim()
    .optional()
    .nullable(),
  status: z.enum(["TODO", "IN_PROGRESS", "DONE"]).optional(),
  priority: z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"]).optional(),
  dueDate: z.string().datetime().optional().nullable(),
  assigneeId: z.string().cuid("Invalid assignee ID").optional().nullable(),
});
