// ---------------------------------------------------------------------------
// TaskFlow Mobile — tasks data hook
//
// Same table, same columns, same RLS-enforced ownership as the web app's
// src/services/tasks.ts / src/hooks/useTasks.ts — just the React Native
// client instead of the browser client. Includes the same Realtime
// subscription pattern as the web app.
// ---------------------------------------------------------------------------
import { useCallback, useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import type { Task, TaskInsert, TaskUpdate } from "../types/task";

export function useTasks(userId: string | null) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadTasks = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    const { data, error: fetchError } = await supabase
      .from("tasks")
      .select("*")
      .order("created_at", { ascending: false });

    if (fetchError) {
      setError(fetchError.message);
    } else {
      setTasks(data ?? []);
    }
    setIsLoading(false);
  }, []);

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
  }, [userId]);

  const addTask = useCallback(
    async (ownerId: string, values: TaskInsert) => {
      const { data, error: createError } = await supabase
        .from("tasks")
        .insert({
          user_id: ownerId,
          title: values.title.trim(),
          description: values.description?.trim() || null,
          status: values.status ?? "todo",
          priority: values.priority ?? "medium",
          due_date: values.due_date || null,
        })
        .select("*")
        .single();

      if (createError) throw new Error(createError.message);
      setTasks((current) => (current.some((t) => t.id === data.id) ? current : [data, ...current]));
      return data;
    },
    []
  );

  const editTask = useCallback(async (id: string, values: TaskUpdate) => {
    const payload: TaskUpdate & { updated_at: string } = {
      ...values,
      updated_at: new Date().toISOString(),
    };
    if (typeof values.title === "string") payload.title = values.title.trim();
    if (typeof values.description === "string") {
      payload.description = values.description.trim() || null;
    }

    const { data, error: updateError } = await supabase
      .from("tasks")
      .update(payload)
      .eq("id", id)
      .select("*")
      .single();

    if (updateError) throw new Error(updateError.message);
    setTasks((current) => current.map((t) => (t.id === id ? data : t)));
    return data;
  }, []);

  const removeTask = useCallback(async (id: string) => {
    const { error: deleteError } = await supabase.from("tasks").delete().eq("id", id);
    if (deleteError) throw new Error(deleteError.message);
    setTasks((current) => current.filter((t) => t.id !== id));
  }, []);

  return { tasks, isLoading, error, reload: loadTasks, addTask, editTask, removeTask };
}
