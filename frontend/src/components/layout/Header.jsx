import { Menu, LogOut, Bell } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { cn } from "../../lib/utils";

const PAGE_TITLES = {
  "/dashboard": "Dashboard",
  "/projects": "Projects",
  "/my-tasks": "My Tasks",
  "/profile": "Profile",
};

export default function Header({ onMenuClick }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const title =
    Object.entries(PAGE_TITLES).find(([path]) =>
      location.pathname.startsWith(path)
    )?.[1] || "TaskFlow";

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  return (
    <header className="h-16 shrink-0 flex items-center justify-between px-4 sm:px-6 border-b border-border bg-card/80 backdrop-blur-md">
      <div className="flex items-center gap-3">
        <button
          onClick={onMenuClick}
          className="lg:hidden p-2 rounded-lg hover:bg-muted transition-colors"
        >
          <Menu className="w-5 h-5" />
        </button>
        <h1 className="font-display font-semibold text-xl text-foreground">
          {title}
        </h1>
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={handleLogout}
          className={cn(
            "flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium",
            "text-muted-foreground hover:text-destructive hover:bg-destructive/10",
            "transition-all duration-150"
          )}
        >
          <LogOut className="w-4 h-4" />
          <span className="hidden sm:inline">Sign out</span>
        </button>
      </div>
    </header>
  );
}
