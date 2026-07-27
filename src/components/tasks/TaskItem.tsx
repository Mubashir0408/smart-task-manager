"use client";

import { useState } from "react";
import type { Task, TaskStatus } from "@/types/task";
import { StatusBadge } from "./StatusBadge";
import { PriorityBadge } from "./PriorityBadge";
import { formatDate, isOverdue } from "@/utils/date";
import { Select } from "../ui/Select";
import { Button } from "../ui/Button";
import { ConfirmDialog } from "../ui/ConfirmDialog";
import { cn } from "@/utils/cn";

interface TaskItemProps {
  task: Task;
  isMutating: boolean;
  onEdit: (task: Task) => void;
  onDelete: (id: string) => Promise<void>;
  onStatusChange: (id: string, status: TaskStatus) => void;
  onAnnotate: (task: Task) => void;
}

const PRIORITY_ACCENT: Record<Task["priority"], string> = {
  low: "before:bg-sky-400",
  medium: "before:bg-violet-400",
  high: "before:bg-rose-400",
};

export function TaskItem({
  task,
  isMutating,
  onEdit,
  onDelete,
  onStatusChange,
  onAnnotate,
}: TaskItemProps) {
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const overdue = isOverdue(task.due_date, task.status);

  const handleDelete = async () => {
    setIsDeleting(true);
    await onDelete(task.id);
    setIsDeleting(false);
    setConfirmOpen(false);
  };

  return (
    <>
      <div
        className={cn(
          "glass-panel animate-fade-in relative flex flex-col gap-3 overflow-hidden rounded-2xl p-4 pl-5 transition-all duration-200 hover:-translate-y-0.5 hover:border-white/25 sm:flex-row sm:items-center sm:justify-between",
          "before:absolute before:inset-y-0 before:left-0 before:w-1 before:content-['']",
          PRIORITY_ACCENT[task.priority]
        )}
      >
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="truncate font-medium text-white">{task.title}</h3>
            <StatusBadge status={task.status} />
            <PriorityBadge priority={task.priority} />
            {overdue && (
              <span className="inline-flex items-center rounded-full bg-rose-500/15 px-2.5 py-0.5 text-xs font-medium text-rose-300 ring-1 ring-inset ring-rose-400/25">
                Overdue
              </span>
            )}
          </div>
          {task.description && (
            <p className="mt-1 line-clamp-2 text-sm text-slate-400">{task.description}</p>
          )}
          <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-500">
            <span>Due {formatDate(task.due_date)}</span>
            <span>Created {formatDate(task.created_at)}</span>
          </div>
        </div>
        <div className="flex flex-shrink-0 flex-wrap items-center gap-2">
          <Select
            aria-label={`Change status for ${task.title}`}
            value={task.status}
            disabled={isMutating}
            onChange={(e) => onStatusChange(task.id, e.target.value as TaskStatus)}
            className="w-36"
          >
            <option value="todo">To Do</option>
            <option value="in_progress">In Progress</option>
            <option value="completed">Completed</option>
          </Select>
          <Button variant="secondary" size="sm" onClick={() => onAnnotate(task)}>
            Annotate Image
          </Button>
          <Button variant="secondary" size="sm" onClick={() => onEdit(task)}>
            Edit
          </Button>
          <Button variant="danger" size="sm" onClick={() => setConfirmOpen(true)}>
            Delete
          </Button>
        </div>
      </div>
      <ConfirmDialog
        open={confirmOpen}
        title="Delete task"
        description={`Are you sure you want to delete "${task.title}"? This action cannot be undone.`}
        confirmLabel="Delete"
        isLoading={isDeleting}
        onConfirm={handleDelete}
        onCancel={() => setConfirmOpen(false)}
      />
    </>
  );
}
