import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from "recharts";
import {
  FolderKanban, CheckSquare, AlertTriangle, Clock,
  TrendingUp, ArrowRight, User, Loader2,
} from "lucide-react";
import { dashboardApi } from "../lib/api";
import { cn, STATUS_CONFIG, PRIORITY_CONFIG, formatDate, isOverdue, getInitials, getAvatarColor } from "../lib/utils";
import { useAuth } from "../context/AuthContext";

const CHART_COLORS = ["#6366f1", "#8b5cf6", "#06b6d4", "#10b981", "#f59e0b", "#ef4444"];
const STATUS_COLORS = { TODO: "#94a3b8", IN_PROGRESS: "#6366f1", DONE: "#10b981" };
const PRIORITY_COLORS = { LOW: "#94a3b8", MEDIUM: "#3b82f6", HIGH: "#f97316", URGENT: "#ef4444" };

function StatCard({ icon: Icon, label, value, sub, color = "primary", loading }) {
  const colorMap = {
    primary: "bg-primary/10 text-primary",
    warning: "bg-amber-100 text-amber-600 dark:bg-amber-950",
    destructive: "bg-red-100 text-red-600 dark:bg-red-950",
    success: "bg-emerald-100 text-emerald-600 dark:bg-emerald-950",
  };
  return (
    <div className="bg-card border border-border rounded-xl p-5 space-y-4">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-muted-foreground">{label}</span>
        <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center", colorMap[color])}>
          <Icon className="w-4 h-4" />
        </div>
      </div>
      {loading ? (
        <div className="h-8 w-16 bg-muted animate-pulse rounded" />
      ) : (
        <div>
          <p className="font-display text-3xl font-bold text-foreground">{value}</p>
          {sub && <p className="text-xs text-muted-foreground mt-1">{sub}</p>}
        </div>
      )}
    </div>
  );
}

export default function DashboardPage() {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    dashboardApi.get()
      .then((res) => setData(res.data.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const statusChartData = data
    ? Object.entries(data.tasksByStatus).map(([name, value]) => ({
        name: STATUS_CONFIG[name]?.label || name, value,
      }))
    : [];

  const priorityChartData = data
    ? Object.entries(data.tasksByPriority).map(([name, value]) => ({
        name: PRIORITY_CONFIG[name]?.label || name, value,
        fill: PRIORITY_COLORS[name],
      }))
    : [];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Welcome */}
      <div>
        <h2 className="font-display text-2xl font-bold text-foreground">
          Good {new Date().getHours() < 12 ? "morning" : new Date().getHours() < 18 ? "afternoon" : "evening"},{" "}
          {user?.name?.split(" ")[0]} 👋
        </h2>
        <p className="text-muted-foreground text-sm mt-1">
          Here's what's happening across your projects today.
        </p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={FolderKanban} label="Total Projects" value={data?.totalProjects ?? 0} loading={loading} />
        <StatCard icon={CheckSquare} label="Total Tasks" value={data?.totalTasks ?? 0} sub="Across all projects" loading={loading} />
        <StatCard icon={AlertTriangle} label="Overdue Tasks" value={data?.overdueTasks ?? 0} color="destructive" loading={loading} />
        <StatCard icon={Clock} label="My Tasks" value={data?.myAssignedTasks ?? 0} sub={`${data?.myOverdueTasks ?? 0} overdue`} color="warning" loading={loading} />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Tasks by status */}
        <div className="bg-card border border-border rounded-xl p-5">
          <h3 className="font-display font-semibold text-foreground mb-4">Tasks by Status</h3>
          {loading ? (
            <div className="h-48 bg-muted animate-pulse rounded-lg" />
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={statusChartData} cx="50%" cy="50%" innerRadius={55} outerRadius={80} paddingAngle={3} dataKey="value">
                  {statusChartData.map((entry, i) => (
                    <Cell key={i} fill={Object.values(STATUS_COLORS)[i]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => [value, "Tasks"]} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Tasks by priority */}
        <div className="bg-card border border-border rounded-xl p-5">
          <h3 className="font-display font-semibold text-foreground mb-4">Tasks by Priority</h3>
          {loading ? (
            <div className="h-48 bg-muted animate-pulse rounded-lg" />
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={priorityChartData} barSize={28}>
                <XAxis dataKey="name" tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
                <Tooltip formatter={(value) => [value, "Tasks"]} />
                <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                  {priorityChartData.map((entry, i) => (
                    <Cell key={i} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Bottom section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Project summaries */}
        <div className="lg:col-span-2 bg-card border border-border rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-display font-semibold text-foreground">Projects Overview</h3>
            <Link to="/projects" className="text-xs text-primary hover:underline flex items-center gap-1">
              View all <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          {loading ? (
            <div className="space-y-3">
              {[1,2,3].map(i => <div key={i} className="h-14 bg-muted animate-pulse rounded-lg" />)}
            </div>
          ) : data?.projectSummaries?.length === 0 ? (
            <p className="text-muted-foreground text-sm text-center py-8">No projects yet. <Link to="/projects" className="text-primary hover:underline">Create one</Link></p>
          ) : (
            <div className="space-y-3">
              {data?.projectSummaries?.slice(0, 4).map((proj) => (
                <Link key={proj.id} to={`/projects/${proj.id}`} className="flex items-center gap-4 p-3 rounded-lg hover:bg-muted/50 transition-colors group">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="font-medium text-sm text-foreground group-hover:text-primary transition-colors truncate">{proj.name}</span>
                      <span className="text-xs text-muted-foreground shrink-0 ml-2">{proj.progress}%</span>
                    </div>
                    <div className="w-full bg-muted rounded-full h-1.5">
                      <div className="bg-primary rounded-full h-1.5 transition-all" style={{ width: `${proj.progress}%` }} />
                    </div>
                    <div className="flex gap-3 mt-1.5 text-xs text-muted-foreground">
                      <span>{proj.taskStats.TODO} to do</span>
                      <span>{proj.taskStats.IN_PROGRESS} in progress</span>
                      <span>{proj.taskStats.DONE} done</span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Tasks per user */}
        <div className="bg-card border border-border rounded-xl p-5">
          <h3 className="font-display font-semibold text-foreground mb-4">Tasks per Member</h3>
          {loading ? (
            <div className="space-y-3">
              {[1,2,3].map(i => <div key={i} className="h-10 bg-muted animate-pulse rounded-lg" />)}
            </div>
          ) : data?.tasksPerUser?.length === 0 ? (
            <p className="text-muted-foreground text-sm text-center py-8">No assignments yet</p>
          ) : (
            <div className="space-y-3">
              {data?.tasksPerUser?.sort((a, b) => b.count - a.count).slice(0, 6).map(({ user: u, count }) => (
                <div key={u?.id} className="flex items-center gap-3">
                  <div className={cn("w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0", getAvatarColor(u?.name))}>
                    {getInitials(u?.name)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{u?.name}</p>
                  </div>
                  <span className="text-sm font-semibold text-foreground">{count}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Recent activity */}
      {data?.recentTasks?.length > 0 && (
        <div className="bg-card border border-border rounded-xl p-5">
          <h3 className="font-display font-semibold text-foreground mb-4">Recent Tasks</h3>
          <div className="divide-y divide-border">
            {data.recentTasks.slice(0, 5).map((task) => {
              const sc = STATUS_CONFIG[task.status];
              const pc = PRIORITY_CONFIG[task.priority];
              const overdue = isOverdue(task.dueDate, task.status);
              return (
                <div key={task.id} className="py-3 flex items-center gap-3">
                  <div className={cn("w-2 h-2 rounded-full shrink-0", sc?.dot)} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{task.title}</p>
                    <p className="text-xs text-muted-foreground">{task.project?.name}</p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className={cn("text-xs px-2 py-0.5 rounded-full font-medium", pc?.bg, pc?.color)}>
                      {pc?.label}
                    </span>
                    {overdue && (
                      <span className="text-xs text-destructive font-medium">Overdue</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
