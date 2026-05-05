import { cn, getInitials, getAvatarColor } from "../../lib/utils";

export function Avatar({ name, size = "md", className }) {
  const sizes = {
    xs: "w-5 h-5 text-[9px]",
    sm: "w-7 h-7 text-xs",
    md: "w-9 h-9 text-sm",
    lg: "w-12 h-12 text-base",
    xl: "w-16 h-16 text-xl",
    "2xl": "w-20 h-20 text-2xl",
  };

  return (
    <div
      className={cn(
        "rounded-full flex items-center justify-center text-white font-bold shrink-0",
        getAvatarColor(name),
        sizes[size],
        className
      )}
      title={name}
    >
      {getInitials(name)}
    </div>
  );
}

export function AvatarGroup({ names = [], max = 4, size = "sm" }) {
  const visible = names.slice(0, max);
  const overflow = names.length - max;

  const sizes = {
    xs: "w-5 h-5 text-[9px]",
    sm: "w-7 h-7 text-xs",
    md: "w-9 h-9 text-sm",
  };

  return (
    <div className="flex -space-x-2">
      {visible.map((name, i) => (
        <div
          key={i}
          title={name}
          className={cn(
            "rounded-full border-2 border-card flex items-center justify-center text-white font-bold shrink-0",
            getAvatarColor(name),
            sizes[size]
          )}
        >
          {getInitials(name)}
        </div>
      ))}
      {overflow > 0 && (
        <div
          className={cn(
            "rounded-full border-2 border-card bg-muted flex items-center justify-center font-bold text-muted-foreground shrink-0",
            sizes[size]
          )}
        >
          +{overflow}
        </div>
      )}
    </div>
  );
}
