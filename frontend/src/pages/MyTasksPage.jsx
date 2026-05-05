import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  CheckSquare, Calendar, FolderKanban,
  Loader2, Filter, ArrowUpRight, AlertTriangle,
} from "lucide-react";
import { taskApi } from "../lib/api";
import { useToast } from "../components/ui/Toast";
import {
  cn, STATUS_CONFIG, PRIORITY_CONFIG, formatDate,
  isOverdue, getDaysUntilDue, getInitials, getAvatarColor,
} from "../lib/utils";

// ─── Task Row ─────────────────────────────────────────────────────────────────
function TaskRow({ task, onStatusChange }) {
  const pc = PRIORITY_CONFIG[task.priority];
  const sc = STATUS_CONFIG[task.status];
  const overdue = isOverdue(task.dueDate, task.status);
  const daysUntil = getDaysUntilDue(task.dueDate);
  const [updating, setUpdating] = useState(false);

  const handleStatus = async (newStatus) => {
    setUpdating(true);
    await onStatusChange(task.id, newStatus);
    setUpdating(false);
  };

  return (
    <div
      className={cn(
        "group flex flex-col sm:flex-row sm:items-center gap-3 p-4 bg-card border rounded-xl transition-all duration-200 hover:shadow-md",
        overdue && task.status !== "DONE"
          ? "border-destructive/30 hover:border-destructive/50"
          : "border-border hover:border-primary/20"
      )}
    >
      {/* Status dot + title */}
      <div className="flex items-start gap-3 flex-1 min-w-0">
        <div className={cn("w-2 h-2 rounded-full mt-1.5 shrink-0", sc?.dot)} />
        <div className="flex-1 min-w-0">
          <p className={cn(
            "font-medium text-sm text-foreground",
            task.status === "DONE" && "line-through opacity-50"
          )}>
            {task.title}
          </p>
          {task.description && (
            <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{task.description}</p>
          )}
          <Link
            to={`/projects/${task.project?.id}`}
            className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-primary transition-colors mt-1"
          >
            <FolderKanban className="w-3 h-3" />
            {task.project?.name}
            <ArrowUpRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
          </Link>
        </div>
      </div>

      {/* Meta + status */}
      <div className="flex items-center gap-2.5 flex-wrap sm:flex-nowrap shrink-0">
        <span className={cn("text-xs px-2 py-0.5 rounded-full font-medium shrink-0", pc?.bg, pc?.color)}>
          {pc?.label}
        </span>

        {task.dueDate && (
          <div className={cn(
            "flex items-center gap-1 text-xs shrink-0",
            overdue && task.status !== "DONE"
              ? "text-destructive font-medium"
              : daysUntil !== null && daysUntil <= 3
              ? "text-amber-600"
              : "text-muted-foreground"
          )}>
            <Calendar className="w-3.5 h-3.5" />
            {overdue && task.status !== "DONE" ? "Overdue · " : ""}
            {formatDate(task.dueDate)}
          </div>
        )}

        <select
          value={task.status}
          onChange={(e) => handleStatus(e.target.value)}
          disabled={updating}
          className={cn(
            "text-xs px-2.5 py-1 rounded-lg border-0 font-medium cursor-pointer",
            "focus:outline-none focus:ring-2 focus:ring-primary/30 shrink-0 transition-all",
            sc?.bg, sc?.color
          )}
        >
          {Object.entries(STATUS_CONFIG).map(([v, c]) => (
            <option key={v} value={v}>{c.label}</option>
          ))}
        </select>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function MyTasksPage() {
  const { toast } = useToast();
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState("ALL");
  const [filterPriority, setFilterPriority] = useState("ALL");

  useEffect(() => {
    taskApi
      .getMyTasks()
      .then((res) => setTasks(res.data.data.tasks))
      .catch(() => toast({ title: "Failed to load tasks", variant: "destructive" }))
      .finally(() => setLoading(false));
  }, []);

  const handleStatusChange = async (taskId, status) => {
    try {
      const res = await taskApi.update(taskId, { status });
      setTasks((prev) => prev.map((t) => (t.id === taskId ? res.data.data.task : t)));
      toast({ title: "Status updated", variant: "success" });
    } catch (err) {
      toast({ title: "Error", description: err.response?.data?.message || "Failed to update", variant: "destructive" });
    }
  };

  const filtered = tasks.filter((t) => {
    if (filterStatus !== "ALL" && t.status !== filterStatus) return false;
    if (filterPriority !== "ALL" && t.priority !== filterPriority) return false;
    return true;
  });

  const overdueTasks = tasks.filter((t) => isOverdue(t.dueDate, t.status));
  const byStatus = {
    TODO: tasks.filter((t) => t.status === "TODO").length,
    IN_PROGRESS: tasks.filter((t) => t.status === "IN_PROGRESS").length,
    DONE: tasks.filter((t) => t.status === "DONE").length,
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <h2 className="font-display text-2xl font-bold text-foreground">My Tasks</h2>
        <p className="text-muted-foreground text-sm mt-1">
          All tasks assigned to you across every project
        </p>
      </div>

      {/* Quick stats */}
      {!loading && tasks.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: "Total", count: tasks.length, colorClass: "text-foreground", bgClass: "bg-card" },
            { label: "To Do", count: byStatus.TODO, colorClass: "text-slate-600", bgClass: "bg-slate-50 dark:bg-slate-900" },
            { label: "In Progress", count: byStatus.IN_PROGRESS, colorClass: "text-indigo-600", bgClass: "bg-indigo-50 dark:bg-indigo-950" },
            { label: "Overdue", count: overdueTasks.length, colorClass: "text-red-600", bgClass: "bg-red-50 dark:bg-red-950" },
          ].map(({ label, count, colorClass, bgClass }) => (
            <div key={label} className={cn("rounded-xl border border-border p-4", bgClass)}>
              <p className={cn("font-display text-2xl font-bold", colorClass)}>{count}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{label}</p>
            </div>
          ))}
        </div>
      )}

      {/* Overdue alert */}
      {!loading && overdueTasks.length > 0 && (
        <div className="flex items-center gap-3 p-4 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive">
          <AlertTriangle className="w-5 h-5 shrink-0" />
          <p className="text-sm font-medium">
            You have {overdueTasks.length} overdue task{overdueTasks.length !== 1 ? "s" : ""} that need attention.
          </p>
        </div>
      )}

      {/* Filters */}
      {tasks.length > 0 && (
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1.5 text-sm text-muted-foreground shrink-0">
            <Filter className="w-4 h-4" /> Filter:
          </div>

          <div className="flex flex-wrap gap-2">
            {[
              { v: "ALL", l: "All Status" },
              ...Object.entries(STATUS_CONFIG).map(([v, c]) => ({ v, l: c.label })),
            ].map(({ v, l }) => (
              <button
                key={v}
                onClick={() => setFilterStatus(v)}
                className={cn(
                  "px-3 py-1.5 rounded-lg text-xs font-medium transition-all",
                  filterStatus === v
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "bg-muted text-muted-foreground hover:bg-muted/80"
                )}
              >
                {l}
              </button>
            ))}
          </div>

          <div className="w-px h-4 bg-border hidden sm:block" />

          <div className="flex flex-wrap gap-2">
            {[
              { v: "ALL", l: "All Priority" },
              ...Object.entries(PRIORITY_CONFIG).map(([v, c]) => ({ v, l: c.label })),
            ].map(({ v, l }) => (
              <button
                key={v}
                onClick={() => setFilterPriority(v)}
                className={cn(
                  "px-3 py-1.5 rounded-lg text-xs font-medium transition-all",
                  filterPriority === v
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "bg-muted text-muted-foreground hover:bg-muted/80"
                )}
              >
                {l}
              </button>
            ))}
          </div>

          {(filterStatus !== "ALL" || filterPriority !== "ALL") && (
            <button
              onClick={() => { setFilterStatus("ALL"); setFilterPriority("ALL"); }}
              className="text-xs text-muted-foreground hover:text-primary transition-colors underline-offset-2 hover:underline"
            >
              Clear filters
            </button>
          )}
        </div>
      )}

      {/* Content */}
      {loading ? (
        <div className="space-y-2.5">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-20 bg-muted animate-pulse rounded-xl" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
            <CheckSquare className="w-8 h-8 text-primary" />
          </div>
          <h3 className="font-display text-lg font-semibold text-foreground mb-2">
            {tasks.length === 0 ? "No tasks assigned" : "No tasks match filters"}
          </h3>
          <p className="text-muted-foreground text-sm max-w-xs">
            {tasks.length === 0
              ? "Tasks assigned to you will appear here. Ask your project admin to assign you tasks."
              : "Try adjusting the filters above to see more tasks."}
          </p>
          {tasks.length > 0 && (
            <button
              onClick={() => { setFilterStatus("ALL"); setFilterPriority("ALL"); }}
              className="mt-4 text-sm text-primary hover:underline"
            >
              Clear all filters
            </button>
          )}
        </div>
      ) : (
        /* Grouped by status */
        <div className="space-y-1">
          {["IN_PROGRESS", "TODO", "DONE"].map((status) => {
            const statusTasks = filtered.filter((t) => t.status === status);
            if (statusTasks.length === 0) return null;
            const config = STATUS_CONFIG[status];
            return (
              <div key={status}>
                <div className="flex items-center gap-2 mt-5 mb-2.5 first:mt-0">
                  <div className={cn("w-2.5 h-2.5 rounded-full", config.dot)} />
                  <span className="text-sm font-semibold text-foreground">{config.label}</span>
                  <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                    {statusTasks.length}
                  </span>
                </div>
                <div className="space-y-2">
                  {statusTasks.map((task) => (
                    <TaskRow
                      key={task.id}
                      task={task}
                      onStatusChange={handleStatusChange}
                    />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
