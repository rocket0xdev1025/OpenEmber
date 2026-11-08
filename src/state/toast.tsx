import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";

type Toast = { id: number; title: string; body?: string };

type ToastContextValue = {
  notify: (title: string, body?: string) => void;
};

const ToastContext = createContext<ToastContextValue | null>(null);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const notify = useCallback((title: string, body?: string) => {
    const id = Date.now() + Math.random();
    setToasts((current) => [...current, { id, title, body }]);
    window.setTimeout(() => {
      setToasts((current) => current.filter((toast) => toast.id !== id));
    }, 3200);
  }, []);
  const value = useMemo(() => ({ notify }), [notify]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="pointer-events-none fixed inset-x-0 bottom-4 z-50 flex flex-col items-center gap-2 px-4">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className="pointer-events-auto w-full max-w-sm rounded-md border border-border bg-surface px-4 py-3 shadow-2xl"
            role="status"
          >
            <p className="text-sm text-foreground">{toast.title}</p>
            {toast.body ? <p className="mt-1 text-[13px] text-muted">{toast.body}</p> : null}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const value = useContext(ToastContext);
  if (!value) throw new Error("useToast must be used inside ToastProvider");
  return value;
}
