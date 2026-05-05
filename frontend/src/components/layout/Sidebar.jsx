import { NavLink, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  FolderKanban,
  CheckSquare,
  X,
  Zap,
  User,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { cn, getInitials, getAvatarColor } from "../../lib/utils";

const navItems = [
  { to: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
  { to: "/projects", icon: FolderKanban, label: "Projects" },
  { to: "/my-tasks", icon: CheckSquare, label: "My Tasks" },
];

export default function Sidebar({ open, onClose }) {
  const { user } = useAuth();
  const location = useLocation();

  return (
    <aside
      className={cn(
        "fixed inset-y-0 left-0 z-30 w-64 flex flex-col bg-card border-r border-border",
        "transition-transform duration-300 ease-in-out",
        "lg:relative lg:translate-x-0",
        open ? "translate-x-0" : "-translate-x-full"
      )}
    >
      {/* Logo */}
      <div className="flex items-center justify-between h-16 px-6 border-b border-border shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center shadow-sm">
            <Zap className="w-4 h-4 text-white fill-white" />
          </div>
          <span className="font-display font-bold text-lg tracking-tight">
            TaskFlow
          </span>
        </div>
        <button
          onClick={onClose}
          className="lg:hidden p-1.5 rounded-md hover:bg-muted transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto scrollbar-thin">
        <p className="px-3 mb-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          Menu
        </p>
        {navItems.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            onClick={onClose}
            className={({ isActive }) =>
              cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150",
                isActive
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )
            }
          >
            {({ isActive }) => (
              <>
                <Icon
                  className={cn(
                    "w-4 h-4 shrink-0",
                    isActive ? "text-primary" : "text-muted-foreground"
                  )}
                />
                {label}
                {isActive && (
                  <div className="ml-auto w-1.5 h-1.5 rounded-full bg-primary" />
                )}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* User profile footer */}
      <div className="px-3 pb-4 shrink-0">
        <NavLink
          to="/profile"
          onClick={onClose}
          className={({ isActive }) =>
            cn(
              "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150",
              isActive
                ? "bg-primary/10 text-primary"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            )
          }
        >
          <div
            className={cn(
              "w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0",
              getAvatarColor(user?.name)
            )}
          >
            {getInitials(user?.name)}
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-medium text-foreground text-xs truncate">{user?.name}</p>
            <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
          </div>
          <User className="w-3.5 h-3.5 shrink-0" />
        </NavLink>
      </div>
    </aside>
  );
}
