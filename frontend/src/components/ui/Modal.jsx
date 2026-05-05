import { useEffect, useRef } from "react";
import { X } from "lucide-react";
import { cn } from "../../lib/utils";

export function Modal({ open, onClose, title, children, size = "md", className }) {
  const overlayRef = useRef(null);

  useEffect(() => {
    if (!open) return;
    const handleKey = (e) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handleKey);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  if (!open) return null;

  const sizes = {
    sm: "max-w-sm",
    md: "max-w-md",
    lg: "max-w-lg",
    xl: "max-w-xl",
    "2xl": "max-w-2xl",
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Overlay */}
      <div
        ref={overlayRef}
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Panel */}
      <div
        className={cn(
          "relative w-full bg-card border border-border rounded-2xl shadow-2xl",
          "animate-fade-in overflow-hidden",
          sizes[size],
          className
        )}
      >
        {/* Header */}
        {title && (
          <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-border">
            <h2 className="font-display text-xl font-bold text-foreground">{title}</h2>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Body */}
        <div className={cn("overflow-y-auto max-h-[80vh]", title ? "p-6" : "p-6")}>
          {children}
        </div>
      </div>
    </div>
  );
}
