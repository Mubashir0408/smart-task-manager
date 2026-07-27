import type { Task, TaskStatus } from "@/types/task";
import { TaskItem } from "./TaskItem";
import { EmptyState } from "../ui/EmptyState";
import { Spinner } from "../ui/Spinner";
import { Button } from "../ui/Button";

interface TaskListProps {
  tasks: Task[];
  isLoading: boolean;
  mutatingIds: Record<string, boolean>;
  hasAnyTasks: boolean;
  onEdit: (task: Task) => void;
  onDelete: (id: string) => Promise<void>;
  onStatusChange: (id: string, status: TaskStatus) => void;
  onAnnotate: (task: Task) => void;
  onCreateClick: () => void;
}

export function TaskList({
  tasks,
  isLoading,
  mutatingIds,
  hasAnyTasks,
  onEdit,
  onDelete,
  onStatusChange,
  onAnnotate,
  onCreateClick,
}: TaskListProps) {
  if (isLoading) {
    return (
      <div className="flex justify-center py-16">
        <Spinner size="lg" className="text-cyan-400" />
      </div>
    );
  }

  if (tasks.length === 0) {
    return (
      <EmptyState
        title={hasAnyTasks ? "No tasks match your filters" : "No tasks yet"}
        description={
          hasAnyTasks
            ? "Try adjusting your search or filters."
            : "Create your first task to get started."
        }
        action={
          !hasAnyTasks ? <Button onClick={onCreateClick}>Create task</Button> : undefined
        }
      />
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {tasks.map((task) => (
        <TaskItem
          key={task.id}
          task={task}
          isMutating={Boolean(mutatingIds[task.id])}
          onEdit={onEdit}
          onDelete={onDelete}
          onStatusChange={onStatusChange}
          onAnnotate={onAnnotate}
        />
      ))}
    </div>
  );
}
