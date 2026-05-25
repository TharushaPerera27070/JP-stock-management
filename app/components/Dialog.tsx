"use client";

import React, {
  useState,
  useCallback,
  createContext,
  useContext,
  useRef,
  useEffect,
} from "react";
import {
  AlertTriangle,
  CheckCircle2,
  Info,
  XCircle,
  X,
  Trash2,
} from "lucide-react";

/* ─────────────────────────────────────────────────────────────
   TYPES
───────────────────────────────────────────────────────────── */
type DialogVariant = "danger" | "warning" | "info" | "success";

interface ConfirmOptions {
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: DialogVariant;
}

interface ToastOptions {
  message: string;
  type?: "success" | "error" | "info" | "delete";
  duration?: number;
}

interface DialogContextValue {
  confirm: (opts: ConfirmOptions) => Promise<boolean>;
  toast: (opts: ToastOptions) => void;
}

/* ─────────────────────────────────────────────────────────────
   CONTEXT
───────────────────────────────────────────────────────────── */
const DialogContext = createContext<DialogContextValue | null>(null);

export function useDialog() {
  const ctx = useContext(DialogContext);
  if (!ctx) throw new Error("useDialog must be used inside <DialogProvider>");
  return ctx;
}

/* ─────────────────────────────────────────────────────────────
   TOAST
───────────────────────────────────────────────────────────── */
interface ToastItem extends ToastOptions {
  id: number;
}

function Toast({
  item,
  onRemove,
}: {
  item: ToastItem;
  onRemove: (id: number) => void;
}) {
  const duration = item.duration ?? 3500;
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    const startedAt = Date.now();
    const tick = window.setInterval(() => {
      setElapsed(Math.min(Date.now() - startedAt, duration));
    }, 50);
    const t = window.setTimeout(() => onRemove(item.id), duration);

    return () => {
      clearInterval(tick);
      clearTimeout(t);
    };
  }, [duration, item.id, onRemove]);

  useEffect(() => {
    setElapsed(0);
  }, [item.id]);

  const config = {
    success: {
      icon: <CheckCircle2 className="w-5 h-5 shrink-0" />,
      bg: "bg-emerald-600",
    },
    delete: {
      icon: <Trash2 className="w-5 h-5 shrink-0" />,
      bg: "bg-red-600",
    },
    error: { icon: <XCircle className="w-5 h-5 shrink-0" />, bg: "bg-red-600" },
    info: { icon: <Info className="w-5 h-5 shrink-0" />, bg: "bg-gray-800" },
  }[item.type ?? "info"];

  return (
    <div
      className={`relative overflow-hidden flex items-center gap-3 px-5 py-3.5 pr-4 rounded-2xl shadow-xl text-white text-sm font-semibold animate-in fade-in slide-in-from-right-6 duration-300 ${config.bg}`}
    >
      {config.icon}
      <div className="min-w-0 flex-1">
        <span className="block leading-snug">{item.message}</span>
        <div className="mt-2 h-1 rounded-full bg-white/20 overflow-hidden">
          <div
            className="h-full rounded-full bg-white/80 transition-[width] duration-75 ease-linear"
            style={{
              width: `${Math.max(0, 100 - (elapsed / duration) * 100)}%`,
            }}
          />
        </div>
      </div>
      <div className="flex items-center gap-2 shrink-0 ml-2">
        <span className="text-[11px] font-medium text-white/80 tabular-nums">
          {Math.max(0, Math.ceil((duration - elapsed) / 1000))}s
        </span>
        <button
          onClick={() => onRemove(item.id)}
          className="opacity-70 hover:opacity-100 transition"
          aria-label="Dismiss toast"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   CONFIRM MODAL
───────────────────────────────────────────────────────────── */
interface ConfirmModalProps extends ConfirmOptions {
  onConfirm: () => void;
  onCancel: () => void;
}

const variantConfig: Record<
  DialogVariant,
  { icon: React.ReactNode; iconBg: string; confirmCls: string }
> = {
  danger: {
    icon: <Trash2 className="w-6 h-6" />,
    iconBg: "bg-red-100 text-red-600",
    confirmCls: "bg-red-600 hover:bg-red-700 text-white",
  },
  warning: {
    icon: <AlertTriangle className="w-6 h-6" />,
    iconBg: "bg-amber-100 text-amber-600",
    confirmCls: "bg-[#E8973A] hover:bg-[#d4832b] text-gray-900",
  },
  info: {
    icon: <Info className="w-6 h-6" />,
    iconBg: "bg-blue-100 text-blue-600",
    confirmCls: "bg-blue-600 hover:bg-blue-700 text-white",
  },
  success: {
    icon: <CheckCircle2 className="w-6 h-6" />,
    iconBg: "bg-emerald-100 text-emerald-600",
    confirmCls: "bg-emerald-600 hover:bg-emerald-700 text-white",
  },
};

function ConfirmModal({
  title,
  message,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  variant = "danger",
  onConfirm,
  onCancel,
}: ConfirmModalProps) {
  const cfg = variantConfig[variant];
  const cancelRef = useRef<HTMLButtonElement>(null);

  // focus the cancel button on mount for keyboard accessibility
  useEffect(() => {
    cancelRef.current?.focus();
  }, []);

  return (
    <div
      className="fixed inset-0 z-200 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onCancel();
      }}
    >
      <div className="bg-white rounded-2xl shadow-2xl border border-gray-100 w-full max-w-sm overflow-hidden animate-in zoom-in-95 duration-200">
        {/* Top accent */}
        <div
          className={`h-1 w-full ${variant === "danger" ? "bg-red-500" : variant === "warning" ? "bg-[#E8973A]" : variant === "success" ? "bg-emerald-500" : "bg-blue-500"}`}
        />

        <div className="p-6">
          {/* Icon + Title */}
          <div className="flex items-start gap-4 mb-4">
            <div
              className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${cfg.iconBg}`}
            >
              {cfg.icon}
            </div>
            <div>
              <h2 className="text-base font-bold text-gray-900">{title}</h2>
              <p className="text-sm text-gray-500 mt-1 leading-relaxed">
                {message}
              </p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 justify-end mt-6">
            <button
              ref={cancelRef}
              onClick={onCancel}
              className="px-5 py-2.5 text-sm font-semibold text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-xl transition active:scale-95 cursor-pointer"
            >
              {cancelLabel}
            </button>
            <button
              onClick={onConfirm}
              className={`px-5 py-2.5 text-sm font-bold rounded-xl transition active:scale-95 cursor-pointer shadow-sm ${cfg.confirmCls}`}
            >
              {confirmLabel}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   PROVIDER
───────────────────────────────────────────────────────────── */
let toastIdCounter = 0;

export function DialogProvider({ children }: { children: React.ReactNode }) {
  const [modal, setModal] = useState<
    (ConfirmModalProps & { resolve: (v: boolean) => void }) | null
  >(null);
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const confirm = useCallback((opts: ConfirmOptions): Promise<boolean> => {
    return new Promise((resolve) => {
      setModal({
        ...opts,
        resolve,
        onConfirm: () => {
          setModal(null);
          resolve(true);
        },
        onCancel: () => {
          setModal(null);
          resolve(false);
        },
      });
    });
  }, []);

  const toast = useCallback((opts: ToastOptions) => {
    const id = ++toastIdCounter;
    setToasts((prev) => [...prev, { ...opts, id }]);
  }, []);

  const removeToast = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <DialogContext.Provider value={{ confirm, toast }}>
      {children}

      {/* Confirm modal */}
      {modal && (
        <ConfirmModal
          title={modal.title}
          message={modal.message}
          confirmLabel={modal.confirmLabel}
          cancelLabel={modal.cancelLabel}
          variant={modal.variant}
          onConfirm={modal.onConfirm}
          onCancel={modal.onCancel}
        />
      )}

      {/* Toast stack */}
      <div className="fixed top-6 right-6 z-300 flex flex-col gap-3 items-end pointer-events-none">
        {toasts.map((t) => (
          <div key={t.id} className="pointer-events-auto">
            <Toast item={t} onRemove={removeToast} />
          </div>
        ))}
      </div>
    </DialogContext.Provider>
  );
}
