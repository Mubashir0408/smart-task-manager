import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";
import type { Task, TaskInsert, TaskUpdate } from "@/types/task";

type TypedClient = SupabaseClient<Database>;

export async function fetchTasks(client: TypedClient): Promise<Task[]> {
  const { data, error } = await client
    .from("tasks")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data ?? [];
}

export async function createTask(
  client: TypedClient,
  userId: string,
  values: TaskInsert
): Promise<Task> {
  const { data, error } = await client
    .from("tasks")
    .insert({
      user_id: userId,
      title: values.title.trim(),
      description: values.description?.trim() || null,
      status: values.status ?? "todo",
      priority: values.priority ?? "medium",
      due_date: values.due_date || null,
    })
    .select("*")
    .single();

  if (error) throw error;
  return data;
}

export async function updateTask(
  client: TypedClient,
  id: string,
  values: TaskUpdate
): Promise<Task> {
  const payload: Database["public"]["Tables"]["tasks"]["Update"] = {
    ...values,
    updated_at: new Date().toISOString(),
  };
  if (typeof values.title === "string") payload.title = values.title.trim();
  if (typeof values.description === "string") {
    payload.description = values.description.trim() || null;
  }

  const { data, error } = await client
    .from("tasks")
    .update(payload)
    .eq("id", id)
    .select("*")
    .single();

  if (error) throw error;
  return data;
}

export async function deleteTask(client: TypedClient, id: string): Promise<void> {
  const { error } = await client.from("tasks").delete().eq("id", id);
  if (error) throw error;
}
