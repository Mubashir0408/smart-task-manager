"use client";

import { useToast } from "@/hooks/useToast";
import { cn } from "@/utils/cn";

const VARIANT_STYLES: Record<string, string> = {
  success: "bg-emerald-500/15 text-emerald-100 border-emerald-400/30",
  error: "bg-rose-500/15 text-rose-100 border-rose-400/30",
  info: "bg-cyan-500/15 text-cyan-100 border-cyan-400/30",
};

export function Toaster() {
  const { toasts, dismissToast } = useToast();

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 flex w-full max-w-sm flex-col gap-2 sm:bottom-6 sm:right-6">
      {toasts.map((toast) => (
        <button
          key={toast.id}
          type="button"
          onClick={() => dismissToast(toast.id)}
          className={cn(
            "animate-slide-up flex items-start justify-between gap-3 rounded-2xl border px-4 py-3 text-left text-sm shadow-2xl backdrop-blur-xl transition hover:opacity-90",
            VARIANT_STYLES[toast.variant]
          )}
        >
          <span>{toast.message}</span>
          <span aria-hidden className="text-lg leading-none">
            &times;
          </span>
        </button>
      ))}
    </div>
  );
}
