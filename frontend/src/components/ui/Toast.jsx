import { createContext, useContext, useState, useCallback, useEffect } from "react";
import { CheckCircle2, XCircle, AlertTriangle, Info, X } from "lucide-react";
import { cn } from "../../lib/utils";

const ToastContext = createContext(null);
let toastCounter = 0;

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const toast = useCallback(({ title, description, variant = "default", duration = 4000 }) => {
    const id = ++toastCounter;
    setToasts((prev) => [...prev, { id, title, description, variant, duration }]);
    return id;
  }, []);

  const dismiss = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ toast, dismiss }}>
      {children}
      <ToastContainer toasts={toasts} dismiss={dismiss} />
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within ToastProvider");
  return ctx;
}

// Individual toast item with auto-dismiss
function ToastItem({ toast, dismiss }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Animate in
    requestAnimationFrame(() => setVisible(true));

    const timer = setTimeout(() => {
      setVisible(false);
      setTimeout(() => dismiss(toast.id), 300);
    }, toast.duration || 4000);

    return () => clearTimeout(timer);
  }, [toast.id, toast.duration, dismiss]);

  const icons = {
    success: <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />,
    destructive: <XCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />,
    warning: <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />,
    default: <Info className="w-4 h-4 text-primary shrink-0 mt-0.5" />,
  };

  const styles = {
    success: "border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950",
    destructive: "border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-950",
    warning: "border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950",
    default: "border-border bg-card",
  };

  return (
    <div
      className={cn(
        "flex items-start gap-3 p-4 pr-3 rounded-xl border shadow-lg max-w-sm w-full",
        "transition-all duration-300",
        styles[toast.variant] || styles.default,
        visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2"
      )}
    >
      {icons[toast.variant] || icons.default}
      <div className="flex-1 min-w-0">
        {toast.title && (
          <p className="text-sm font-semibold text-foreground leading-snug">{toast.title}</p>
        )}
        {toast.description && (
          <p className="text-sm text-muted-foreground mt-0.5 leading-snug">{toast.description}</p>
        )}
      </div>
      <button
        onClick={() => {
          setVisible(false);
          setTimeout(() => dismiss(toast.id), 300);
        }}
        className="p-1 rounded-md hover:bg-black/5 dark:hover:bg-white/5 transition-colors shrink-0"
      >
        <X className="w-3.5 h-3.5 text-muted-foreground" />
      </button>
    </div>
  );
}

function ToastContainer({ toasts, dismiss }) {
  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2 items-end pointer-events-none">
      {toasts.map((t) => (
        <div key={t.id} className="pointer-events-auto">
          <ToastItem toast={t} dismiss={dismiss} />
        </div>
      ))}
    </div>
  );
}
