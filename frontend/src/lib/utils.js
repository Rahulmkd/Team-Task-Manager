import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

export function formatDate(date) {
  if (!date) return "No due date";
  return new Date(date).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function isOverdue(dueDate, status) {
  if (!dueDate || status === "DONE") return false;
  return new Date(dueDate) < new Date();
}

export function getDaysUntilDue(dueDate) {
  if (!dueDate) return null;
  const diff = new Date(dueDate) - new Date();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

export const PRIORITY_CONFIG = {
  LOW: { label: "Low", color: "text-slate-500", bg: "bg-slate-100 dark:bg-slate-800", border: "border-slate-200" },
  MEDIUM: { label: "Medium", color: "text-blue-600", bg: "bg-blue-50 dark:bg-blue-950", border: "border-blue-200" },
  HIGH: { label: "High", color: "text-orange-600", bg: "bg-orange-50 dark:bg-orange-950", border: "border-orange-200" },
  URGENT: { label: "Urgent", color: "text-red-600", bg: "bg-red-50 dark:bg-red-950", border: "border-red-200" },
};

export const STATUS_CONFIG = {
  TODO: { label: "To Do", color: "text-slate-600", bg: "bg-slate-100 dark:bg-slate-800", dot: "bg-slate-400" },
  IN_PROGRESS: { label: "In Progress", color: "text-indigo-600", bg: "bg-indigo-50 dark:bg-indigo-950", dot: "bg-indigo-500" },
  DONE: { label: "Done", color: "text-emerald-600", bg: "bg-emerald-50 dark:bg-emerald-950", dot: "bg-emerald-500" },
};

export function getInitials(name) {
  if (!name) return "?";
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export const AVATAR_COLORS = [
  "bg-violet-500",
  "bg-indigo-500",
  "bg-blue-500",
  "bg-cyan-500",
  "bg-teal-500",
  "bg-emerald-500",
  "bg-amber-500",
  "bg-rose-500",
  "bg-pink-500",
  "bg-fuchsia-500",
];

export function getAvatarColor(name) {
  if (!name) return AVATAR_COLORS[0];
  const index = name.charCodeAt(0) % AVATAR_COLORS.length;
  return AVATAR_COLORS[index];
}
