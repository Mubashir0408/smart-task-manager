"use client";

import { useState } from "react";
import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";
import { useTasks } from "@/hooks/useTasks";
import { WelcomeBanner } from "@/components/dashboard/WelcomeBanner";
import { StatCard } from "@/components/dashboard/StatCard";
import { CompletionRing } from "@/components/dashboard/CompletionRing";
import { StatusBreakdown } from "@/components/dashboard/StatusBreakdown";
import { TaskList } from "@/components/tasks/TaskList";
import { TaskFormModal } from "@/components/tasks/TaskFormModal";
import { TaskAnnotationModal } from "@/components/tasks/TaskAnnotationModal";
import { ErrorState } from "@/components/ui/ErrorState";
import { Button } from "@/components/ui/Button";
import type { Task, TaskInsert, TaskUpdate } from "@/types/task";

export default function DashboardPage() {
  const { user } = useAuth();
  const {
    tasks,
    allTasksCount,
    stats,
    isLoading,
    error,
    reload,
    isCreating,
    mutatingIds,
    addTask,
    editTask,
    changeStatus,
    removeTask,
  } = useTasks(user?.id ?? null);

  const [modalOpen, setModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [annotatingTask, setAnnotatingTask] = useState<Task | null>(null);

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

  const recentTasks = tasks.slice(0, 5);

  return (
    <div className="flex flex-col gap-6">
      <WelcomeBanner email={user?.email} />

      {error && <ErrorState message={error} onRetry={reload} />}

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatCard
          label="Total Tasks"
          value={stats.total}
          icon="📋"
          accent="bg-blue-500/15 text-blue-300"
        />
        <StatCard
          label="To Do"
          value={stats.todo}
          icon="🕒"
          accent="bg-slate-400/15 text-slate-300"
        />
        <StatCard
          label="In Progress"
          value={stats.inProgress}
          icon="⚡"
          accent="bg-amber-500/15 text-amber-300"
        />
        <StatCard
          label="Completed"
          value={stats.completed}
          icon="✅"
          accent="bg-emerald-500/15 text-emerald-300"
        />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <CompletionRing completed={stats.completed} total={stats.total} />
        <StatusBreakdown stats={stats} />
      </div>

      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-white">Recent activity</h2>
          <div className="flex items-center gap-3">
            <Link href="/tasks" className="text-sm font-medium text-cyan-400 hover:text-cyan-300">
              View all
            </Link>
            <Button size="sm" onClick={openCreateModal}>
              + New task
            </Button>
          </div>
        </div>

        <TaskList
          tasks={recentTasks}
          isLoading={isLoading}
          mutatingIds={mutatingIds}
          hasAnyTasks={allTasksCount > 0}
          onEdit={openEditModal}
          onDelete={removeTask}
          onStatusChange={changeStatus}
          onAnnotate={setAnnotatingTask}
          onCreateClick={openCreateModal}
        />
      </div>

      <TaskFormModal
        open={modalOpen}
        task={editingTask}
        isSubmitting={isCreating || (editingTask ? Boolean(mutatingIds[editingTask.id]) : false)}
        onClose={() => setModalOpen(false)}
        onSubmit={handleSubmit}
      />

      {annotatingTask && (
        <TaskAnnotationModal task={annotatingTask} onClose={() => setAnnotatingTask(null)} />
      )}
    </div>
  );
}
