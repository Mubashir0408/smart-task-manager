import type { TaskStats } from "@/types/task";

/**
 * Status distribution as direct-labeled horizontal bars. Reuses the exact
 * colors StatusBadge already uses elsewhere in the app (todo = slate,
 * in_progress = amber, completed = emerald) rather than a separate
 * categorical ramp — same entity, same color, everywhere. Each bar is
 * labeled with its name and count directly (identity is never color-alone).
 */
const ROWS: Array<{ key: keyof TaskStats; label: string; barClass: string; textClass: string }> = [
  { key: "todo", label: "Todo", barClass: "bg-slate-400", textClass: "text-slate-300" },
  { key: "inProgress", label: "In Progress", barClass: "bg-amber-400", textClass: "text-amber-300" },
  { key: "completed", label: "Completed", barClass: "bg-emerald-400", textClass: "text-emerald-300" },
];

export function StatusBreakdown({ stats }: { stats: TaskStats }) {
  const max = Math.max(stats.todo, stats.inProgress, stats.completed, 1);

  return (
    <div className="glass-panel animate-slide-up rounded-2xl p-5">
      <p className="text-sm font-medium text-slate-400">Tasks by status</p>
      <div className="mt-4 flex flex-col gap-3">
        {ROWS.map((row) => {
          const value = stats[row.key] as number;
          const widthPct = (value / max) * 100;
          return (
            <div key={row.key} className="flex items-center gap-3">
              <span className={`w-24 shrink-0 text-xs font-medium ${row.textClass}`}>
                {row.label}
              </span>
              <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-white/5">
                <div
                  className={`h-full rounded-full ${row.barClass} transition-[width] duration-700 ease-out`}
                  style={{ width: `${widthPct}%` }}
                />
              </div>
              <span className="w-6 shrink-0 text-right text-xs font-semibold text-white">
                {value}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
