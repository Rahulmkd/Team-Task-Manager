import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  ArrowLeft, Plus, Users, Trash2, Crown,
  UserMinus, UserPlus, X, Loader2, Calendar,
  Edit2, CheckSquare, AlertTriangle, Settings,
  MoreVertical, FolderKanban,
} from "lucide-react";
import { projectApi, taskApi } from "../lib/api";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../components/ui/Toast";
import {
  cn, STATUS_CONFIG, PRIORITY_CONFIG, formatDate, isOverdue,
  getInitials, getAvatarColor, getDaysUntilDue,
} from "../lib/utils";

const taskSchema = z.object({
  title: z.string().min(2, "Title must be at least 2 characters"),
  description: z.string().optional(),
  priority: z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"]),
  status: z.enum(["TODO", "IN_PROGRESS", "DONE"]),
  dueDate: z.string().optional(),
  assigneeId: z.string().optional(),
});

// ─── Task Modal ───────────────────────────────────────────────────────────────
function TaskModal({ projectId, members, task, onClose, onSaved }) {
  const { toast } = useToast();
  const isEdit = !!task;
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(taskSchema),
    defaultValues: task
      ? { title: task.title, description: task.description || "", priority: task.priority, status: task.status, dueDate: task.dueDate ? task.dueDate.slice(0, 10) : "", assigneeId: task.assigneeId || "" }
      : { priority: "MEDIUM", status: "TODO", assigneeId: "" },
  });

  const onSubmit = async (data) => {
    try {
      const payload = { ...data, assigneeId: data.assigneeId || null, dueDate: data.dueDate ? new Date(data.dueDate).toISOString() : null, projectId };
      const result = isEdit ? await taskApi.update(task.id, payload) : await taskApi.create(payload);
      onSaved(result.data.data.task, isEdit);
      toast({ title: isEdit ? "Task updated" : "Task created", variant: "success" });
      onClose();
    } catch (err) {
      toast({ title: "Error", description: err.response?.data?.message || "Failed to save task", variant: "destructive" });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-lg bg-card border border-border rounded-2xl shadow-2xl animate-fade-in overflow-hidden">
        <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-border">
          <h2 className="font-display text-xl font-bold text-foreground">{isEdit ? "Edit Task" : "New Task"}</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-muted transition-colors"><X className="w-4 h-4 text-muted-foreground" /></button>
        </div>
        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-foreground">Title <span className="text-destructive">*</span></label>
            <input {...register("title")} autoFocus placeholder="What needs to be done?" className={cn("w-full px-4 py-2.5 rounded-lg border bg-background text-foreground text-sm placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all", errors.title ? "border-destructive" : "border-input")} />
            {errors.title && <p className="text-destructive text-xs">{errors.title.message}</p>}
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-foreground">Description</label>
            <textarea {...register("description")} rows={3} placeholder="Add more details..." className="w-full px-4 py-2.5 rounded-lg border border-input bg-background text-foreground text-sm placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all resize-none" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-foreground">Priority</label>
              <select {...register("priority")} className="w-full px-4 py-2.5 rounded-lg border border-input bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary cursor-pointer">
                {Object.entries(PRIORITY_CONFIG).map(([v, c]) => <option key={v} value={v}>{c.label}</option>)}
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-foreground">Status</label>
              <select {...register("status")} className="w-full px-4 py-2.5 rounded-lg border border-input bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary cursor-pointer">
                {Object.entries(STATUS_CONFIG).map(([v, c]) => <option key={v} value={v}>{c.label}</option>)}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-foreground">Due Date</label>
              <input {...register("dueDate")} type="date" className="w-full px-4 py-2.5 rounded-lg border border-input bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary" />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-foreground">Assign To</label>
              <select {...register("assigneeId")} className="w-full px-4 py-2.5 rounded-lg border border-input bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary cursor-pointer">
                <option value="">Unassigned</option>
                {members.map((m) => <option key={m.userId} value={m.userId}>{m.user.name}</option>)}
              </select>
            </div>
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 px-4 py-2.5 rounded-lg border border-input text-sm font-medium text-foreground hover:bg-muted transition-colors">Cancel</button>
            <button type="submit" disabled={isSubmitting} className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-all disabled:opacity-60">
              {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : isEdit ? "Save Changes" : "Create Task"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Add Member Modal ─────────────────────────────────────────────────────────
function AddMemberModal({ projectId, onClose, onAdded }) {
  const { toast } = useToast();
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("MEMBER");
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      const res = await projectApi.addMember(projectId, { email, role });
      onAdded(res.data.data.member);
      toast({ title: "Member added", description: `${email} joined the project.`, variant: "success" });
      onClose();
    } catch (err) {
      toast({ title: "Error", description: err.response?.data?.message || "Failed to add member", variant: "destructive" });
    } finally { setLoading(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md bg-card border border-border rounded-2xl shadow-2xl animate-fade-in overflow-hidden">
        <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-border">
          <h2 className="font-display text-xl font-bold">Add Member</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-muted transition-colors"><X className="w-4 h-4 text-muted-foreground" /></button>
        </div>
        <form onSubmit={onSubmit} className="p-6 space-y-4">
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-foreground">Email Address</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="colleague@example.com" required autoFocus className="w-full px-4 py-2.5 rounded-lg border border-input bg-background text-foreground text-sm placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary" />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-foreground">Role</label>
            <select value={role} onChange={(e) => setRole(e.target.value)} className="w-full px-4 py-2.5 rounded-lg border border-input bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary cursor-pointer">
              <option value="MEMBER">Member — Can update assigned tasks only</option>
              <option value="ADMIN">Admin — Full project management access</option>
            </select>
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 px-4 py-2.5 rounded-lg border border-input text-sm font-medium hover:bg-muted transition-colors">Cancel</button>
            <button type="submit" disabled={loading} className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-all disabled:opacity-60">
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <><UserPlus className="w-4 h-4" />Add Member</>}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Edit Project Modal ───────────────────────────────────────────────────────
function EditProjectModal({ project, onClose, onUpdated }) {
  const { toast } = useToast();
  const [name, setName] = useState(project.name);
  const [description, setDescription] = useState(project.description || "");
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e) => {
    e.preventDefault();
    if (name.trim().length < 2) return;
    try {
      setLoading(true);
      const res = await projectApi.update(project.id, { name: name.trim(), description: description.trim() });
      onUpdated(res.data.data.project);
      toast({ title: "Project updated", variant: "success" });
      onClose();
    } catch (err) {
      toast({ title: "Error", description: err.response?.data?.message || "Failed to update", variant: "destructive" });
    } finally { setLoading(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md bg-card border border-border rounded-2xl shadow-2xl animate-fade-in overflow-hidden">
        <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-border">
          <h2 className="font-display text-xl font-bold">Edit Project</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-muted transition-colors"><X className="w-4 h-4 text-muted-foreground" /></button>
        </div>
        <form onSubmit={onSubmit} className="p-6 space-y-4">
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-foreground">Project Name</label>
            <input value={name} onChange={(e) => setName(e.target.value)} required autoFocus className="w-full px-4 py-2.5 rounded-lg border border-input bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary" />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-foreground">Description</label>
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} className="w-full px-4 py-2.5 rounded-lg border border-input bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary resize-none" />
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 px-4 py-2.5 rounded-lg border border-input text-sm font-medium hover:bg-muted transition-colors">Cancel</button>
            <button type="submit" disabled={loading} className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 disabled:opacity-60">
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Save Changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Task Card ────────────────────────────────────────────────────────────────
function TaskCard({ task, isAdmin, onEdit, onDelete, onStatusChange }) {
  const pc = PRIORITY_CONFIG[task.priority];
  const sc = STATUS_CONFIG[task.status];
  const overdue = isOverdue(task.dueDate, task.status);
  const daysUntil = getDaysUntilDue(task.dueDate);
  const [menuOpen, setMenuOpen] = useState(false);
  const [updating, setUpdating] = useState(false);

  return (
    <div className={cn("group bg-card border rounded-xl p-4 space-y-3 hover:shadow-md transition-all duration-200", overdue ? "border-destructive/40" : "border-border hover:border-primary/20")}>
      <div className="flex items-start justify-between gap-2">
        <p className={cn("font-medium text-sm text-foreground leading-snug flex-1", task.status === "DONE" && "line-through opacity-50")}>{task.title}</p>
        {isAdmin && (
          <div className="relative shrink-0">
            <button onClick={() => setMenuOpen(!menuOpen)} className="p-1 rounded-md hover:bg-muted transition-colors opacity-0 group-hover:opacity-100"><MoreVertical className="w-3.5 h-3.5 text-muted-foreground" /></button>
            {menuOpen && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} />
                <div className="absolute right-0 top-6 z-20 w-36 bg-popover border border-border rounded-xl shadow-lg overflow-hidden text-sm">
                  <button onClick={() => { setMenuOpen(false); onEdit(task); }} className="flex items-center gap-2 w-full px-3 py-2 hover:bg-muted text-foreground"><Edit2 className="w-3.5 h-3.5" />Edit</button>
                  <button onClick={() => { setMenuOpen(false); onDelete(task.id); }} className="flex items-center gap-2 w-full px-3 py-2 hover:bg-destructive/10 text-destructive"><Trash2 className="w-3.5 h-3.5" />Delete</button>
                </div>
              </>
            )}
          </div>
        )}
      </div>

      {task.description && <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">{task.description}</p>}

      <div className="flex flex-wrap gap-1.5">
        <span className={cn("text-xs px-2 py-0.5 rounded-full font-medium", pc?.bg, pc?.color)}>{pc?.label}</span>
        {overdue && <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-red-50 dark:bg-red-950 text-red-600 flex items-center gap-1"><AlertTriangle className="w-3 h-3" />Overdue</span>}
        {!overdue && daysUntil !== null && daysUntil <= 3 && task.status !== "DONE" && (
          <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-amber-50 dark:bg-amber-950 text-amber-600">Due soon</span>
        )}
      </div>

      <div className="flex items-center justify-between pt-1 border-t border-border">
        <div className="flex items-center gap-2">
          {task.assignee ? (
            <div className="flex items-center gap-1.5">
              <div className={cn("w-5 h-5 rounded-full flex items-center justify-center text-white text-[9px] font-bold", getAvatarColor(task.assignee.name))}>{getInitials(task.assignee.name)}</div>
              <span className="text-xs text-muted-foreground">{task.assignee.name.split(" ")[0]}</span>
            </div>
          ) : (
            <span className="text-xs text-muted-foreground/50 italic">Unassigned</span>
          )}
          {task.dueDate && (
            <span className={cn("text-xs flex items-center gap-1", overdue ? "text-destructive font-medium" : daysUntil !== null && daysUntil <= 3 ? "text-amber-600" : "text-muted-foreground")}>
              <Calendar className="w-3 h-3" />{formatDate(task.dueDate)}
            </span>
          )}
        </div>
        <select
          value={task.status}
          onChange={async (e) => { setUpdating(true); await onStatusChange(task.id, e.target.value); setUpdating(false); }}
          disabled={updating}
          className={cn("text-xs px-2 py-1 rounded-lg border-0 font-medium cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all", sc?.bg, sc?.color)}
        >
          {Object.entries(STATUS_CONFIG).map(([v, c]) => <option key={v} value={v}>{c.label}</option>)}
        </select>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function ProjectDetailPage() {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();

  const [project, setProject] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("tasks");
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [showAddMember, setShowAddMember] = useState(false);
  const [showEditProject, setShowEditProject] = useState(false);
  const [filterStatus, setFilterStatus] = useState("ALL");
  const [filterPriority, setFilterPriority] = useState("ALL");
  const [view, setView] = useState("kanban");

  const isAdmin = project?.userRole === "ADMIN";

  const loadData = useCallback(async () => {
    try {
      const [projRes, tasksRes] = await Promise.all([
        projectApi.getOne(projectId),
        taskApi.getAll({ projectId }),
      ]);
      setProject(projRes.data.data.project);
      setTasks(tasksRes.data.data.tasks);
    } catch (err) {
      if (err.response?.status === 403 || err.response?.status === 404) navigate("/projects");
    } finally {
      setLoading(false);
    }
  }, [projectId, navigate]);

  useEffect(() => { loadData(); }, [loadData]);

  const handleTaskSaved = (task, isEdit) => {
    setTasks((prev) => isEdit ? prev.map((t) => t.id === task.id ? task : t) : [task, ...prev]);
  };

  const handleDeleteTask = async (taskId) => {
    if (!window.confirm("Delete this task?")) return;
    try {
      await taskApi.delete(taskId);
      setTasks((prev) => prev.filter((t) => t.id !== taskId));
      toast({ title: "Task deleted", variant: "success" });
    } catch (err) {
      toast({ title: "Error", description: err.response?.data?.message || "Failed to delete", variant: "destructive" });
    }
  };

  const handleStatusChange = async (taskId, status) => {
    try {
      const res = await taskApi.update(taskId, { status });
      setTasks((prev) => prev.map((t) => t.id === taskId ? res.data.data.task : t));
    } catch (err) {
      toast({ title: "Error", description: err.response?.data?.message || "Failed to update", variant: "destructive" });
    }
  };

  const handleRemoveMember = async (memberId, memberName) => {
    if (!window.confirm(`Remove ${memberName}?`)) return;
    try {
      await projectApi.removeMember(projectId, memberId);
      setProject((p) => ({ ...p, members: p.members.filter((m) => m.id !== memberId) }));
      toast({ title: `${memberName} removed`, variant: "success" });
    } catch (err) {
      toast({ title: "Error", description: err.response?.data?.message || "Failed to remove", variant: "destructive" });
    }
  };

  const handleUpdateMemberRole = async (memberId, role) => {
    try {
      await projectApi.updateMemberRole(projectId, memberId, { role });
      setProject((p) => ({ ...p, members: p.members.map((m) => m.id === memberId ? { ...m, role } : m) }));
      toast({ title: "Role updated", variant: "success" });
    } catch (err) {
      toast({ title: "Error", description: err.response?.data?.message || "Failed", variant: "destructive" });
    }
  };

  const handleDeleteProject = async () => {
    if (!window.confirm(`Permanently delete "${project.name}"?`)) return;
    try {
      await projectApi.delete(projectId);
      toast({ title: "Project deleted", variant: "success" });
      navigate("/projects");
    } catch (err) {
      toast({ title: "Error", description: err.response?.data?.message || "Failed", variant: "destructive" });
    }
  };

  const filteredTasks = tasks.filter((t) => {
    if (filterStatus !== "ALL" && t.status !== filterStatus) return false;
    if (filterPriority !== "ALL" && t.priority !== filterPriority) return false;
    return true;
  });

  const tasksByStatus = {
    TODO: filteredTasks.filter((t) => t.status === "TODO"),
    IN_PROGRESS: filteredTasks.filter((t) => t.status === "IN_PROGRESS"),
    DONE: filteredTasks.filter((t) => t.status === "DONE"),
  };

  const overdueTasks = tasks.filter((t) => isOverdue(t.dueDate, t.status));

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Loading project...</p>
        </div>
      </div>
    );
  }
  if (!project) return null;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <div className="space-y-2">
          <Link to="/projects" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="w-4 h-4" /> Back to Projects
          </Link>
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
              <FolderKanban className="w-5 h-5 text-primary" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="font-display text-2xl font-bold text-foreground">{project.name}</h2>
                {isAdmin && (
                  <span className="flex items-center gap-1 text-xs font-medium text-amber-600 bg-amber-50 dark:bg-amber-950 px-2 py-0.5 rounded-full">
                    <Crown className="w-3 h-3" /> Admin
                  </span>
                )}
              </div>
              {project.description && <p className="text-muted-foreground text-sm mt-0.5 max-w-lg">{project.description}</p>}
              <div className="flex items-center gap-4 mt-1.5 text-sm text-muted-foreground flex-wrap">
                <span className="flex items-center gap-1"><CheckSquare className="w-3.5 h-3.5" />{tasks.length} task{tasks.length !== 1 ? "s" : ""}</span>
                <span className="flex items-center gap-1"><Users className="w-3.5 h-3.5" />{project.members?.length} member{project.members?.length !== 1 ? "s" : ""}</span>
                {overdueTasks.length > 0 && (
                  <span className="flex items-center gap-1 text-destructive font-medium"><AlertTriangle className="w-3.5 h-3.5" />{overdueTasks.length} overdue</span>
                )}
              </div>
            </div>
          </div>
        </div>

        {isAdmin && (
          <div className="flex items-center gap-2 shrink-0">
            <button onClick={() => setShowTaskModal(true)} className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-all">
              <Plus className="w-4 h-4" /> Add Task
            </button>
            <button onClick={() => setShowEditProject(true)} className="p-2.5 rounded-lg border border-border text-muted-foreground hover:text-foreground hover:bg-muted transition-all" title="Edit project">
              <Settings className="w-4 h-4" />
            </button>
            <button onClick={handleDeleteProject} className="p-2.5 rounded-lg border border-border text-muted-foreground hover:text-destructive hover:border-destructive/30 hover:bg-destructive/10 transition-all" title="Delete project">
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-border">
        {[
          { id: "tasks", label: "Tasks", icon: CheckSquare, badge: tasks.length },
          { id: "members", label: "Members", icon: Users, badge: project.members?.length },
        ].map(({ id, label, icon: Icon, badge }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id)}
            className={cn("flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-all",
              activeTab === id ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"
            )}
          >
            <Icon className="w-4 h-4" />{label}
            <span className={cn("text-xs px-1.5 py-0.5 rounded-full font-semibold", activeTab === id ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground")}>{badge}</span>
          </button>
        ))}
      </div>

      {/* Tasks Tab */}
      {activeTab === "tasks" && (
        <div className="space-y-4">
          {/* Filters + View Toggle */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex gap-1.5 flex-wrap">
              {[{ v: "ALL", l: "All" }, ...Object.entries(STATUS_CONFIG).map(([v, c]) => ({ v, l: c.label }))].map(({ v, l }) => (
                <button key={v} onClick={() => setFilterStatus(v)}
                  className={cn("px-3 py-1.5 rounded-lg text-xs font-medium transition-all",
                    filterStatus === v ? "bg-primary text-primary-foreground shadow-sm" : "bg-muted/60 text-muted-foreground hover:bg-muted"
                  )}>
                  {l} <span className="ml-1 opacity-70">{v === "ALL" ? tasks.length : tasks.filter(t => t.status === v).length}</span>
                </button>
              ))}
            </div>
            <div className="w-px h-4 bg-border hidden sm:block" />
            <div className="flex gap-1.5 flex-wrap">
              {[{ v: "ALL", l: "All Priority" }, ...Object.entries(PRIORITY_CONFIG).map(([v, c]) => ({ v, l: c.label }))].map(({ v, l }) => (
                <button key={v} onClick={() => setFilterPriority(v)}
                  className={cn("px-3 py-1.5 rounded-lg text-xs font-medium transition-all",
                    filterPriority === v ? "bg-primary text-primary-foreground shadow-sm" : "bg-muted/60 text-muted-foreground hover:bg-muted"
                  )}>
                  {l}
                </button>
              ))}
            </div>
            <div className="ml-auto flex items-center gap-1 bg-muted/60 p-1 rounded-lg">
              {[{ id: "kanban", label: "Kanban" }, { id: "list", label: "List" }].map(({ id, label }) => (
                <button key={id} onClick={() => setView(id)}
                  className={cn("px-3 py-1 rounded-md text-xs font-medium transition-all",
                    view === id ? "bg-card shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"
                  )}>
                  {label}
                </button>
              ))}
            </div>
          </div>

          {filteredTasks.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <div className="w-14 h-14 rounded-2xl bg-muted flex items-center justify-center mb-4"><CheckSquare className="w-7 h-7 text-muted-foreground" /></div>
              <h3 className="font-display text-lg font-semibold text-foreground mb-2">No tasks found</h3>
              <p className="text-muted-foreground text-sm max-w-xs">
                {tasks.length === 0 ? (isAdmin ? "Create the first task for this project." : "No tasks yet. Ask your project admin.") : "No tasks match current filters."}
              </p>
              {isAdmin && tasks.length === 0 && (
                <button onClick={() => setShowTaskModal(true)} className="mt-5 flex items-center gap-2 px-4 py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-all">
                  <Plus className="w-4 h-4" /> Create First Task
                </button>
              )}
            </div>
          ) : view === "kanban" ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {Object.entries(STATUS_CONFIG).map(([status, config]) => (
                <div key={status} className="flex flex-col gap-3 min-w-0">
                  <div className="flex items-center gap-2 px-1">
                    <div className={cn("w-2.5 h-2.5 rounded-full shrink-0", config.dot)} />
                    <h4 className="font-semibold text-sm text-foreground">{config.label}</h4>
                    <span className={cn("ml-auto text-xs font-semibold px-2 py-0.5 rounded-full", config.bg, config.color)}>
                      {tasksByStatus[status].length}
                    </span>
                  </div>
                  <div className="space-y-2.5 min-h-16">
                    {tasksByStatus[status].length === 0 ? (
                      <div className="h-16 flex items-center justify-center rounded-xl border-2 border-dashed border-border text-xs text-muted-foreground">Empty</div>
                    ) : (
                      tasksByStatus[status].map((task) => (
                        <TaskCard key={task.id} task={task} isAdmin={isAdmin}
                          onEdit={(t) => { setEditingTask(t); setShowTaskModal(true); }}
                          onDelete={handleDeleteTask}
                          onStatusChange={handleStatusChange}
                        />
                      ))
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-2">
              {["IN_PROGRESS", "TODO", "DONE"].map((status) => {
                const group = filteredTasks.filter((t) => t.status === status);
                if (group.length === 0) return null;
                const cfg = STATUS_CONFIG[status];
                return (
                  <div key={status}>
                    <div className="flex items-center gap-2 mb-2 mt-4 first:mt-0">
                      <div className={cn("w-2 h-2 rounded-full", cfg.dot)} />
                      <span className="text-sm font-semibold text-foreground">{cfg.label}</span>
                      <span className="text-xs text-muted-foreground">{group.length}</span>
                    </div>
                    {group.map((task) => {
                      const pc = PRIORITY_CONFIG[task.priority];
                      const overdue = isOverdue(task.dueDate, task.status);
                      return (
                        <div key={task.id} className={cn("flex items-center gap-3 p-3.5 bg-card border rounded-xl hover:shadow-sm transition-all group mb-2", overdue ? "border-destructive/30" : "border-border")}>
                          <div className={cn("w-2 h-2 rounded-full shrink-0", cfg.dot)} />
                          <p className={cn("text-sm font-medium text-foreground flex-1 truncate", status === "DONE" && "line-through opacity-50")}>{task.title}</p>
                          <div className="flex items-center gap-2 shrink-0">
                            <span className={cn("text-xs px-2 py-0.5 rounded-full font-medium", pc?.bg, pc?.color)}>{pc?.label}</span>
                            {task.assignee && <div className={cn("w-6 h-6 rounded-full flex items-center justify-center text-white text-[9px] font-bold", getAvatarColor(task.assignee.name))} title={task.assignee.name}>{getInitials(task.assignee.name)}</div>}
                            {task.dueDate && <span className={cn("text-xs", overdue ? "text-destructive" : "text-muted-foreground")}>{formatDate(task.dueDate)}</span>}
                            {isAdmin && (
                              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button onClick={() => { setEditingTask(task); setShowTaskModal(true); }} className="p-1 rounded hover:bg-muted"><Edit2 className="w-3 h-3 text-muted-foreground" /></button>
                                <button onClick={() => handleDeleteTask(task.id)} className="p-1 rounded hover:bg-destructive/10"><Trash2 className="w-3 h-3 text-muted-foreground hover:text-destructive" /></button>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Members Tab */}
      {activeTab === "members" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">{project.members?.length} member{project.members?.length !== 1 ? "s" : ""}</p>
            {isAdmin && (
              <button onClick={() => setShowAddMember(true)} className="flex items-center gap-2 px-3.5 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-all">
                <UserPlus className="w-4 h-4" /> Add Member
              </button>
            )}
          </div>
          <div className="space-y-2">
            {project.members?.map((member) => (
              <div key={member.id} className="flex items-center justify-between p-4 bg-card border border-border rounded-xl hover:border-primary/20 transition-all">
                <div className="flex items-center gap-3">
                  <div className={cn("w-10 h-10 rounded-full flex items-center justify-center text-white font-bold shrink-0", getAvatarColor(member.user.name))}>{getInitials(member.user.name)}</div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-sm text-foreground">{member.user.name}</p>
                      {member.userId === user?.id && <span className="text-xs text-muted-foreground bg-muted px-1.5 py-0.5 rounded-full">you</span>}
                    </div>
                    <p className="text-xs text-muted-foreground">{member.user.email}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {isAdmin && member.userId !== user?.id ? (
                    <select value={member.role} onChange={(e) => handleUpdateMemberRole(member.id, e.target.value)}
                      className={cn("text-xs px-3 py-1.5 rounded-lg border-0 font-medium cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary/30",
                        member.role === "ADMIN" ? "bg-amber-50 dark:bg-amber-950 text-amber-700 dark:text-amber-400" : "bg-muted text-muted-foreground"
                      )}>
                      <option value="MEMBER">Member</option>
                      <option value="ADMIN">Admin</option>
                    </select>
                  ) : (
                    <span className={cn("flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full",
                      member.role === "ADMIN" ? "bg-amber-50 dark:bg-amber-950 text-amber-700 dark:text-amber-400" : "bg-muted text-muted-foreground"
                    )}>
                      {member.role === "ADMIN" && <Crown className="w-3 h-3" />}{member.role}
                    </span>
                  )}
                  {isAdmin && member.userId !== user?.id && (
                    <button onClick={() => handleRemoveMember(member.id, member.user.name)} className="p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-all" title="Remove member">
                      <UserMinus className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Modals */}
      {showTaskModal && (
        <TaskModal projectId={projectId} members={project.members || []} task={editingTask}
          onClose={() => { setShowTaskModal(false); setEditingTask(null); }}
          onSaved={handleTaskSaved}
        />
      )}
      {showAddMember && (
        <AddMemberModal projectId={projectId} onClose={() => setShowAddMember(false)}
          onAdded={(member) => setProject((p) => ({ ...p, members: [...p.members, member] }))}
        />
      )}
      {showEditProject && (
        <EditProjectModal project={project} onClose={() => setShowEditProject(false)}
          onUpdated={(updated) => setProject((p) => ({ ...p, ...updated }))}
        />
      )}
    </div>
  );
}
