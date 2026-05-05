import { forwardRef } from "react";
import { Loader2 } from "lucide-react";
import { cn } from "../../lib/utils";

const variants = {
  default: "bg-primary text-primary-foreground hover:opacity-90",
  secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
  outline: "border border-input bg-transparent text-foreground hover:bg-muted",
  ghost: "bg-transparent text-foreground hover:bg-muted",
  destructive: "bg-destructive text-destructive-foreground hover:opacity-90",
  link: "bg-transparent text-primary underline-offset-4 hover:underline p-0 h-auto",
};

const sizes = {
  sm: "h-8 px-3 text-xs rounded-lg",
  md: "h-10 px-4 text-sm rounded-lg",
  lg: "h-11 px-6 text-sm rounded-xl",
  icon: "h-9 w-9 rounded-lg",
};

const Button = forwardRef(
  (
    {
      children,
      variant = "default",
      size = "md",
      loading = false,
      disabled,
      className,
      ...props
    },
    ref
  ) => {
    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={cn(
          "inline-flex items-center justify-center gap-2 font-medium transition-all duration-150",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
          "disabled:opacity-60 disabled:cursor-not-allowed active:scale-[0.98]",
          variants[variant],
          sizes[size],
          className
        )}
        {...props}
      >
        {loading && <Loader2 className="w-4 h-4 animate-spin" />}
        {children}
      </button>
    );
  }
);

Button.displayName = "Button";
export { Button };
