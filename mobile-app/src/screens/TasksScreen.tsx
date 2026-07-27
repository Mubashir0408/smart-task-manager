import { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useAuth } from "../hooks/useAuth";
import { useTasks } from "../hooks/useTasks";
import { supabase } from "../lib/supabase";
import { TaskFormModal } from "../components/TaskFormModal";
import { TaskItem } from "../components/TaskItem";
import type { Task, TaskInsert, TaskUpdate } from "../types/task";

export function TasksScreen() {
  const { session } = useAuth();
  const userId = session?.user.id ?? null;
  const { tasks, isLoading, error, reload, addTask, editTask, removeTask } = useTasks(userId);

  const [modalVisible, setModalVisible] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const openCreate = () => {
    setEditingTask(null);
    setModalVisible(true);
  };

  const openEdit = (task: Task) => {
    setEditingTask(task);
    setModalVisible(true);
  };

  const handleSubmit = async (values: TaskInsert | TaskUpdate) => {
    if (!userId) return;
    setIsSubmitting(true);
    try {
      if (editingTask) {
        await editTask(editingTask.id, values);
      } else {
        await addTask(userId, values as TaskInsert);
      }
      setModalVisible(false);
    } catch (err) {
      Alert.alert("Error", err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = (id: string) => {
    Alert.alert("Delete task", "Are you sure you want to delete this task?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          try {
            await removeTask(id);
          } catch (err) {
            Alert.alert("Error", err instanceof Error ? err.message : "Could not delete task.");
          }
        },
      },
    ]);
  };

  const handleLogout = () => {
    Alert.alert("Log out", "Are you sure you want to log out?", [
      { text: "Cancel", style: "cancel" },
      { text: "Log out", style: "destructive", onPress: () => supabase.auth.signOut() },
    ]);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.heading}>Your Tasks</Text>
          <Text style={styles.email} numberOfLines={1}>
            {session?.user.email}
          </Text>
        </View>
        <TouchableOpacity onPress={handleLogout}>
          <Text style={styles.logout}>Log out</Text>
        </TouchableOpacity>
      </View>

      {error && (
        <View style={styles.errorBox}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      {isLoading && tasks.length === 0 ? (
        <View style={styles.loadingBox}>
          <ActivityIndicator size="large" color="#4f46e5" />
        </View>
      ) : (
        <FlatList
          data={tasks}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          refreshControl={<RefreshControl refreshing={isLoading} onRefresh={reload} />}
          renderItem={({ item }) => (
            <TaskItem task={item} onEdit={openEdit} onDelete={handleDelete} />
          )}
          ListEmptyComponent={
            <View style={styles.emptyBox}>
              <Text style={styles.emptyTitle}>No tasks yet</Text>
              <Text style={styles.emptyDescription}>Create your first task to get started.</Text>
            </View>
          }
        />
      )}

      <TouchableOpacity style={styles.fab} onPress={openCreate}>
        <Text style={styles.fabText}>+ New Task</Text>
      </TouchableOpacity>

      <TaskFormModal
        visible={modalVisible}
        task={editingTask}
        isSubmitting={isSubmitting}
        onClose={() => setModalVisible(false)}
        onSubmit={handleSubmit}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f9fafb",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 12,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#eef0f3",
  },
  heading: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1f2937",
  },
  email: {
    fontSize: 12,
    color: "#6b7280",
    maxWidth: 220,
  },
  logout: {
    color: "#4f46e5",
    fontWeight: "600",
    fontSize: 13,
  },
  errorBox: {
    backgroundColor: "#fef2f2",
    borderColor: "#fecaca",
    borderWidth: 1,
    borderRadius: 8,
    padding: 10,
    margin: 16,
  },
  errorText: {
    color: "#b91c1c",
    fontSize: 13,
  },
  loadingBox: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  listContent: {
    padding: 16,
    paddingBottom: 90,
  },
  emptyBox: {
    alignItems: "center",
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: "#1f2937",
  },
  emptyDescription: {
    fontSize: 13,
    color: "#6b7280",
    marginTop: 4,
  },
  fab: {
    position: "absolute",
    right: 20,
    bottom: 24,
    backgroundColor: "#4f46e5",
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderRadius: 999,
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  fabText: {
    color: "#fff",
    fontWeight: "700",
  },
});
