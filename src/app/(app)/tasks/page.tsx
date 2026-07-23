"use client";

import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useTasks } from "@/hooks/useTasks";
import { TaskFilters } from "@/components/tasks/TaskFilters";
import { TaskList } from "@/components/tasks/TaskList";
import { TaskFormModal } from "@/components/tasks/TaskFormModal";
import { ErrorState } from "@/components/ui/ErrorState";
import { Button } from "@/components/ui/Button";
import type { Task, TaskInsert, TaskUpdate } from "@/types/task";

export default function TasksPage() {
  const { user } = useAuth();
  const {
    tasks,
    allTasksCount,
    isLoading,
    error,
    filters,
    setFilters,
    isCreating,
    mutatingIds,
    addTask,
    editTask,
    changeStatus,
    removeTask,
    reload,
  } = useTasks(user?.id ?? null);

  const [modalOpen, setModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);

  const openCreateModal = () => {
    setEditingTask(null);
    setModalOpen(true);
  };

  const openEditModal = (task: Task) => {
    setEditingTask(task);
    setModalOpen(true);
  };

  const handleSubmit = async (values: TaskInsert | TaskUpdate) => {
    if (editingTask) {
      await editTask(editingTask.id, values);
    } else {
      await addTask(values as TaskInsert);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-semibold text-slate-900">Your tasks</h2>
          <p className="text-sm text-slate-500">{allTasksCount} total</p>
        </div>
        <Button onClick={openCreateModal}>+ New task</Button>
      </div>

      <TaskFilters filters={filters} onChange={setFilters} />

      {error ? (
        <ErrorState message={error} onRetry={reload} />
      ) : (
        <TaskList
          tasks={tasks}
          isLoading={isLoading}
          mutatingIds={mutatingIds}
          hasAnyTasks={allTasksCount > 0}
          onEdit={openEditModal}
          onDelete={removeTask}
          onStatusChange={changeStatus}
          onCreateClick={openCreateModal}
        />
      )}

      <TaskFormModal
        open={modalOpen}
        task={editingTask}
        isSubmitting={isCreating || (editingTask ? Boolean(mutatingIds[editingTask.id]) : false)}
        onClose={() => setModalOpen(false)}
        onSubmit={handleSubmit}
      />
    </div>
  );
}
