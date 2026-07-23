"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { createTask, deleteTask, fetchTasks, updateTask } from "@/services/tasks";
import type {
  SortOption,
  Task,
  TaskFilters,
  TaskInsert,
  TaskPriority,
  TaskStats,
  TaskStatus,
  TaskUpdate,
} from "@/types/task";
import { useToast } from "./useToast";

const DEFAULT_FILTERS: TaskFilters = {
  search: "",
  status: "all",
  priority: "all",
  sort: "newest",
};

const PRIORITY_WEIGHT: Record<TaskPriority, number> = { high: 0, medium: 1, low: 2 };

function sortTasks(tasks: Task[], sort: SortOption): Task[] {
  const copy = [...tasks];
  switch (sort) {
    case "oldest":
      return copy.sort(
        (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      );
    case "due_date":
      return copy.sort((a, b) => {
        if (!a.due_date && !b.due_date) return 0;
        if (!a.due_date) return 1;
        if (!b.due_date) return -1;
        return new Date(a.due_date).getTime() - new Date(b.due_date).getTime();
      });
    case "priority":
      return copy.sort((a, b) => PRIORITY_WEIGHT[a.priority] - PRIORITY_WEIGHT[b.priority]);
    case "newest":
    default:
      return copy.sort(
        (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
  }
}

export function useTasks(userId: string | null) {
  const supabase = useMemo(() => createClient(), []);
  const { showToast } = useToast();

  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<TaskFilters>(DEFAULT_FILTERS);
  const [isCreating, setIsCreating] = useState(false);
  const [mutatingIds, setMutatingIds] = useState<Record<string, boolean>>({});

  const loadTasks = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await fetchTasks(supabase);
      setTasks(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load tasks.");
    } finally {
      setIsLoading(false);
    }
  }, [supabase]);

  useEffect(() => {
    if (userId) loadTasks();
  }, [userId, loadTasks]);

  useEffect(() => {
    if (!userId) return;

    const channel = supabase
      .channel(`tasks-changes-${userId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "tasks", filter: `user_id=eq.${userId}` },
        (payload) => {
          setTasks((current) => {
            if (payload.eventType === "INSERT") {
              const incoming = payload.new as Task;
              if (current.some((t) => t.id === incoming.id)) return current;
              return [incoming, ...current];
            }
            if (payload.eventType === "UPDATE") {
              const incoming = payload.new as Task;
              return current.map((t) => (t.id === incoming.id ? incoming : t));
            }
            if (payload.eventType === "DELETE") {
              const removedId = (payload.old as Partial<Task>).id;
              return current.filter((t) => t.id !== removedId);
            }
            return current;
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase, userId]);

  const setMutating = useCallback((id: string, value: boolean) => {
    setMutatingIds((current) => {
      const next = { ...current };
      if (value) next[id] = true;
      else delete next[id];
      return next;
    });
  }, []);

  const addTask = useCallback(
    async (values: TaskInsert) => {
      if (!userId) {
        const message = "You must be signed in to create a task.";
        showToast("error", message);
        throw new Error(message);
      }
      setIsCreating(true);
      try {
        const created = await createTask(supabase, userId, values);
        setTasks((current) =>
          current.some((t) => t.id === created.id) ? current : [created, ...current]
        );
        showToast("success", "Task created successfully.");
        return created;
      } catch (err) {
        showToast("error", err instanceof Error ? err.message : "Failed to create task.");
        throw err;
      } finally {
        setIsCreating(false);
      }
    },
    [supabase, userId, showToast]
  );

  const editTask = useCallback(
    async (id: string, values: TaskUpdate) => {
      setMutating(id, true);
      try {
        const updated = await updateTask(supabase, id, values);
        setTasks((current) => current.map((t) => (t.id === id ? updated : t)));
        showToast("success", "Task updated successfully.");
        return updated;
      } catch (err) {
        showToast("error", err instanceof Error ? err.message : "Failed to update task.");
        throw err;
      } finally {
        setMutating(id, false);
      }
    },
    [supabase, showToast, setMutating]
  );

  const changeStatus = useCallback(
    async (id: string, status: TaskStatus) => {
      setMutating(id, true);
      try {
        const updated = await updateTask(supabase, id, { status });
        setTasks((current) => current.map((t) => (t.id === id ? updated : t)));
      } catch (err) {
        showToast("error", err instanceof Error ? err.message : "Failed to update status.");
      } finally {
        setMutating(id, false);
      }
    },
    [supabase, showToast, setMutating]
  );

  const removeTask = useCallback(
    async (id: string) => {
      setMutating(id, true);
      try {
        await deleteTask(supabase, id);
        setTasks((current) => current.filter((t) => t.id !== id));
        showToast("success", "Task deleted.");
      } catch (err) {
        showToast("error", err instanceof Error ? err.message : "Failed to delete task.");
      } finally {
        setMutating(id, false);
      }
    },
    [supabase, showToast, setMutating]
  );

  const filteredTasks = useMemo(() => {
    const search = filters.search.trim().toLowerCase();
    const filtered = tasks.filter((task) => {
      const matchesSearch = !search || task.title.toLowerCase().includes(search);
      const matchesStatus = filters.status === "all" || task.status === filters.status;
      const matchesPriority = filters.priority === "all" || task.priority === filters.priority;
      return matchesSearch && matchesStatus && matchesPriority;
    });
    return sortTasks(filtered, filters.sort);
  }, [tasks, filters]);

  const stats: TaskStats = useMemo(
    () => ({
      total: tasks.length,
      todo: tasks.filter((t) => t.status === "todo").length,
      inProgress: tasks.filter((t) => t.status === "in_progress").length,
      completed: tasks.filter((t) => t.status === "completed").length,
    }),
    [tasks]
  );

  return {
    tasks: filteredTasks,
    allTasksCount: tasks.length,
    stats,
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
    reload: loadTasks,
  };
}
