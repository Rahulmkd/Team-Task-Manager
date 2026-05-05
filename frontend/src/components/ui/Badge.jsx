import { cn } from "../../lib/utils";

export function Badge({ children, variant = "default", className }) {
  const variants = {
    default: "bg-muted text-muted-foreground",
    primary: "bg-primary/10 text-primary",
    success: "bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400",
    warning: "bg-amber-50 dark:bg-amber-950 text-amber-700 dark:text-amber-400",
    destructive: "bg-red-50 dark:bg-red-950 text-red-700 dark:text-red-400",
    outline: "border border-border text-foreground bg-transparent",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium",
        variants[variant],
        className
      )}
    >
      {children}
    </span>
  );
}
