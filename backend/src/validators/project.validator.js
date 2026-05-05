import { z } from "zod";

export const createProjectSchema = z.object({
  name: z
    .string()
    .min(2, "Project name must be at least 2 characters")
    .max(100, "Project name must not exceed 100 characters")
    .trim(),
  description: z
    .string()
    .max(500, "Description must not exceed 500 characters")
    .trim()
    .optional(),
});

export const updateProjectSchema = z.object({
  name: z
    .string()
    .min(2, "Project name must be at least 2 characters")
    .max(100, "Project name must not exceed 100 characters")
    .trim()
    .optional(),
  description: z
    .string()
    .max(500, "Description must not exceed 500 characters")
    .trim()
    .optional(),
});

export const addMemberSchema = z.object({
  email: z.string().email("Invalid email address").toLowerCase().trim(),
  role: z.enum(["ADMIN", "MEMBER"]).default("MEMBER"),
});

export const updateMemberRoleSchema = z.object({
  role: z.enum(["ADMIN", "MEMBER"]),
});
