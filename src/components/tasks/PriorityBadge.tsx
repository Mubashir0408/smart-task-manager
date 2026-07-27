import type { TaskPriority } from "@/types/task";
import { cn } from "@/utils/cn";

const PRIORITY_LABELS: Record<TaskPriority, string> = {
  low: "Low",
  medium: "Medium",
  high: "High",
};

const PRIORITY_STYLES: Record<TaskPriority, string> = {
  low: "bg-sky-400/15 text-sky-300 ring-sky-400/25",
  medium: "bg-violet-400/15 text-violet-300 ring-violet-400/25",
  high: "bg-rose-400/15 text-rose-300 ring-rose-400/25",
};

export function PriorityBadge({ priority }: { priority: TaskPriority }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset",
        PRIORITY_STYLES[priority]
      )}
    >
      {PRIORITY_LABELS[priority]}
    </span>
  );
}
