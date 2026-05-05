import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Plus, FolderKanban, Users, CheckSquare, Crown,
  ArrowRight, Loader2, X, Search, Edit2, Trash2,
} from "lucide-react";
import { projectApi } from "../lib/api";
import { useToast } from "../components/ui/Toast";
import { cn, getInitials, getAvatarColor } from "../lib/utils";

const createSchema = z.object({
  name: z.string().min(2, "Project name must be at least 2 characters").max(100),
  description: z.string().max(500).optional(),
});

// ─── Create/Edit Modal ────────────────────────────────────────────────────────
function ProjectModal({ project, onClose, onSaved }) {
  const { toast } = useToast();
  const isEdit = !!project;
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(createSchema),
    defaultValues: { name: project?.name || "", description: project?.description || "" },
  });

  const onSubmit = async (data) => {
    try {
      const res = isEdit
        ? await projectApi.update(project.id, data)
        : await projectApi.create(data);
      onSaved(res.data.data.project, isEdit);
      toast({ title: isEdit ? "Project updated" : "Project created", variant: "success" });
      onClose();
    } catch (err) {
      toast({ title: "Error", description: err.response?.data?.message || "Failed to save project", variant: "destructive" });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md bg-card border border-border rounded-2xl shadow-2xl animate-fade-in overflow-hidden">
        <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-border">
          <h2 className="font-display text-xl font-bold text-foreground">
            {isEdit ? "Edit Project" : "New Project"}
          </h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-muted transition-colors">
            <X className="w-4 h-4 text-muted-foreground" />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-4">
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-foreground">
              Project Name <span className="text-destructive">*</span>
            </label>
            <input
              {...register("name")}
              autoFocus
              placeholder="e.g. Website Redesign"
              className={cn(
                "w-full px-4 py-2.5 rounded-lg border bg-background text-foreground text-sm",
                "placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all",
                errors.name ? "border-destructive" : "border-input"
              )}
            />
            {errors.name && <p className="text-destructive text-xs">{errors.name.message}</p>}
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-foreground">Description</label>
            <textarea
              {...register("description")}
              rows={3}
              placeholder="What is this project about?"
              className="w-full px-4 py-2.5 rounded-lg border border-input bg-background text-foreground text-sm placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all resize-none"
            />
          </div>

          <div className="flex gap-3 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2.5 rounded-lg border border-input text-foreground text-sm font-medium hover:bg-muted transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-all disabled:opacity-60"
            >
              {isSubmitting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : isEdit ? "Save Changes" : "Create Project"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Project Card ─────────────────────────────────────────────────────────────
function ProjectCard({ project, onEdit, onDelete }) {
  const totalTasks = project._count?.tasks || 0;
  const memberCount = project._count?.members || project.members?.length || 0;
  const members = project.members || [];
  const isAdmin = project.userRole === "ADMIN";

  return (
    <div className="group relative bg-card border border-border rounded-xl p-5 hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5 transition-all duration-200 flex flex-col">
      {/* Admin actions */}
      {isAdmin && (
        <div className="absolute top-4 right-4 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity z-10">
          <button
            onClick={(e) => { e.preventDefault(); onEdit(project); }}
            className="p-1.5 rounded-lg bg-card hover:bg-muted border border-transparent hover:border-border text-muted-foreground hover:text-foreground transition-all"
            title="Edit project"
          >
            <Edit2 className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={(e) => { e.preventDefault(); onDelete(project); }}
            className="p-1.5 rounded-lg bg-card hover:bg-destructive/10 border border-transparent hover:border-destructive/20 text-muted-foreground hover:text-destructive transition-all"
            title="Delete project"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      <Link to={`/projects/${project.id}`} className="flex flex-col flex-1">
        <div className="flex items-start gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
            <FolderKanban className="w-5 h-5 text-primary" />
          </div>
          <div className="flex-1 min-w-0 pr-8">
            {isAdmin && (
              <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-amber-600 bg-amber-50 dark:bg-amber-950 px-1.5 py-0.5 rounded-full mb-1">
                <Crown className="w-2.5 h-2.5" /> Admin
              </span>
            )}
            <h3 className="font-display font-semibold text-foreground group-hover:text-primary transition-colors truncate">
              {project.name}
            </h3>
          </div>
        </div>

        {project.description && (
          <p className="text-muted-foreground text-sm line-clamp-2 mb-4 leading-relaxed">
            {project.description}
          </p>
        )}

        <div className="mt-auto pt-4 border-t border-border flex items-center justify-between">
          <div className="flex items-center gap-3 text-sm text-muted-foreground">
            <span className="flex items-center gap-1">
              <CheckSquare className="w-3.5 h-3.5" /> {totalTasks}
            </span>
            <span className="flex items-center gap-1">
              <Users className="w-3.5 h-3.5" /> {memberCount}
            </span>
          </div>

          {/* Member avatars */}
          <div className="flex -space-x-2">
            {members.slice(0, 4).map((m, i) => (
              <div
                key={m.id || i}
                title={m.user?.name}
                className={cn(
                  "w-6 h-6 rounded-full border-2 border-card flex items-center justify-center text-white text-[9px] font-bold",
                  getAvatarColor(m.user?.name)
                )}
              >
                {getInitials(m.user?.name)}
              </div>
            ))}
            {memberCount > 4 && (
              <div className="w-6 h-6 rounded-full border-2 border-card bg-muted flex items-center justify-center text-[9px] font-bold text-muted-foreground">
                +{memberCount - 4}
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center justify-end mt-3 text-primary opacity-0 group-hover:opacity-100 transition-opacity text-xs font-medium">
          Open project <ArrowRight className="w-3.5 h-3.5 ml-1" />
        </div>
      </Link>
    </div>
  );
}

// ─── Skeleton Card ─────────────────────────────────────────────────────────────
function SkeletonCard() {
  return (
    <div className="bg-card border border-border rounded-xl p-5 space-y-4">
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 bg-muted animate-pulse rounded-xl shrink-0" />
        <div className="flex-1 space-y-2">
          <div className="h-4 bg-muted animate-pulse rounded w-3/4" />
          <div className="h-3 bg-muted animate-pulse rounded w-full" />
          <div className="h-3 bg-muted animate-pulse rounded w-2/3" />
        </div>
      </div>
      <div className="h-px bg-border" />
      <div className="flex justify-between">
        <div className="h-3 bg-muted animate-pulse rounded w-20" />
        <div className="flex -space-x-1">
          {[0, 1, 2].map((i) => <div key={i} className="w-6 h-6 rounded-full bg-muted animate-pulse border-2 border-card" />)}
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function ProjectsPage() {
  const { toast } = useToast();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingProject, setEditingProject] = useState(null);
  const [search, setSearch] = useState("");

  useEffect(() => {
    projectApi
      .getAll()
      .then((res) => setProjects(res.data.data.projects))
      .catch(() => toast({ title: "Failed to load projects", variant: "destructive" }))
      .finally(() => setLoading(false));
  }, []);

  const handleSaved = (project, isEdit) => {
    setProjects((prev) =>
      isEdit
        ? prev.map((p) => (p.id === project.id ? { ...p, ...project } : p))
        : [{ ...project, userRole: "ADMIN" }, ...prev]
    );
  };

  const handleDelete = async (project) => {
    if (!window.confirm(`Delete "${project.name}"? This will remove all tasks.`)) return;
    try {
      await projectApi.delete(project.id);
      setProjects((prev) => prev.filter((p) => p.id !== project.id));
      toast({ title: "Project deleted", variant: "success" });
    } catch (err) {
      toast({ title: "Error", description: err.response?.data?.message || "Failed to delete", variant: "destructive" });
    }
  };

  const filtered = projects.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.description?.toLowerCase().includes(search.toLowerCase())
  );

  const adminProjects = filtered.filter((p) => p.userRole === "ADMIN");
  const memberProjects = filtered.filter((p) => p.userRole !== "ADMIN");

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="font-display text-2xl font-bold text-foreground">Your Projects</h2>
          <p className="text-muted-foreground text-sm mt-1">
            {loading ? "Loading..." : `${projects.length} project${projects.length !== 1 ? "s" : ""}`}
          </p>
        </div>
        <button
          onClick={() => { setEditingProject(null); setShowModal(true); }}
          className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-all shrink-0"
        >
          <Plus className="w-4 h-4" /> New Project
        </button>
      </div>

      {/* Search */}
      {!loading && projects.length > 0 && (
        <div className="relative max-w-sm">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
          <input
            type="text"
            placeholder="Search projects..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-input bg-card text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
          />
        </div>
      )}

      {/* Loading skeletons */}
      {loading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => <SkeletonCard key={i} />)}
        </div>
      )}

      {/* Empty state */}
      {!loading && filtered.length === 0 && (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
            <FolderKanban className="w-8 h-8 text-primary" />
          </div>
          <h3 className="font-display text-lg font-semibold text-foreground mb-2">
            {search ? `No results for "${search}"` : "No projects yet"}
          </h3>
          <p className="text-muted-foreground text-sm max-w-xs mb-6">
            {search
              ? "Try a different search term."
              : "Create your first project and start managing tasks with your team."}
          </p>
          {!search && (
            <button
              onClick={() => setShowModal(true)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-all"
            >
              <Plus className="w-4 h-4" /> Create your first project
            </button>
          )}
        </div>
      )}

      {/* Admin projects */}
      {!loading && adminProjects.length > 0 && (
        <div className="space-y-3">
          {filtered.length > adminProjects.length && (
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
              Managed by you
            </h3>
          )}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {adminProjects.map((project) => (
              <ProjectCard
                key={project.id}
                project={project}
                onEdit={(p) => { setEditingProject(p); setShowModal(true); }}
                onDelete={handleDelete}
              />
            ))}
          </div>
        </div>
      )}

      {/* Member projects */}
      {!loading && memberProjects.length > 0 && (
        <div className="space-y-3">
          {filtered.length > memberProjects.length && (
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
              Member of
            </h3>
          )}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {memberProjects.map((project) => (
              <ProjectCard
                key={project.id}
                project={project}
                onEdit={() => {}}
                onDelete={() => {}}
              />
            ))}
          </div>
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <ProjectModal
          project={editingProject}
          onClose={() => { setShowModal(false); setEditingProject(null); }}
          onSaved={handleSaved}
        />
      )}
    </div>
  );
}
