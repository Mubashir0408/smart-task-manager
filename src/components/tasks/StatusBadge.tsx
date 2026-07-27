import type { TaskStatus } from "@/types/task";
import { cn } from "@/utils/cn";

const STATUS_LABELS: Record<TaskStatus, string> = {
  todo: "To Do",
  in_progress: "In Progress",
  completed: "Completed",
};

const STATUS_STYLES: Record<TaskStatus, string> = {
  todo: "bg-slate-400/15 text-slate-300 ring-slate-400/25",
  in_progress: "bg-amber-400/15 text-amber-300 ring-amber-400/25",
  completed: "bg-emerald-400/15 text-emerald-300 ring-emerald-400/25",
};

export function StatusBadge({ status }: { status: TaskStatus }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset",
        STATUS_STYLES[status]
      )}
    >
      {STATUS_LABELS[status]}
    </span>
  );
}
