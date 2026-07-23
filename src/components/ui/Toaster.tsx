"use client";

import { useToast } from "@/hooks/useToast";
import { cn } from "@/utils/cn";

const VARIANT_STYLES: Record<string, string> = {
  success: "bg-emerald-50 text-emerald-800 border-emerald-200",
  error: "bg-red-50 text-red-800 border-red-200",
  info: "bg-blue-50 text-blue-800 border-blue-200",
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
            "flex items-start justify-between gap-3 rounded-lg border px-4 py-3 text-left text-sm shadow-lg transition hover:opacity-90",
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
