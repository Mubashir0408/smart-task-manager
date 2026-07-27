import type { ReactNode } from "react";

export function EmptyState({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="glass-inset animate-fade-in flex flex-col items-center justify-center gap-3 rounded-3xl border-dashed px-6 py-16 text-center">
      <div className="accent-gradient flex h-14 w-14 items-center justify-center rounded-2xl text-2xl shadow-lg shadow-blue-500/20">
        📋
      </div>
      <h3 className="text-base font-semibold text-white">{title}</h3>
      {description && <p className="max-w-sm text-sm text-slate-400">{description}</p>}
      {action}
    </div>
  );
}
