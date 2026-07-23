import type { TaskPriority } from "@/types/task";
import { cn } from "@/utils/cn";

const PRIORITY_LABELS: Record<TaskPriority, string> = {
  low: "Low",
  medium: "Medium",
  high: "High",
};

const PRIORITY_STYLES: Record<TaskPriority, string> = {
  low: "bg-sky-50 text-sky-700 ring-sky-200",
  medium: "bg-violet-50 text-violet-700 ring-violet-200",
  high: "bg-red-50 text-red-700 ring-red-200",
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
