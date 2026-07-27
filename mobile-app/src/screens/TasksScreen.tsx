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
import { colors, glassPanel, radius, spacing } from "../theme";

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
      <View style={[styles.glow, styles.glowBlue]} pointerEvents="none" />
      <View style={[styles.glow, styles.glowCyan]} pointerEvents="none" />

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
          <ActivityIndicator size="large" color={colors.accentCyan} />
        </View>
      ) : (
        <FlatList
          data={tasks}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={isLoading}
              onRefresh={reload}
              tintColor={colors.accentCyan}
              colors={[colors.accentCyan]}
            />
          }
          renderItem={({ item }) => (
            <TaskItem task={item} onEdit={openEdit} onDelete={handleDelete} />
          )}
          ListEmptyComponent={
            <View style={styles.emptyBox}>
              <View style={styles.emptyIcon}>
                <Text style={styles.emptyGlyph}>✓</Text>
              </View>
              <Text style={styles.emptyTitle}>No tasks yet</Text>
              <Text style={styles.emptyDescription}>Create your first task to get started.</Text>
            </View>
          }
        />
      )}

      <TouchableOpacity style={styles.fab} onPress={openCreate} activeOpacity={0.85}>
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
    backgroundColor: colors.background,
  },
  glow: {
    position: "absolute",
    width: 260,
    height: 260,
    borderRadius: 130,
    opacity: 0.16,
  },
  glowBlue: {
    backgroundColor: colors.accent,
    top: -80,
    left: -80,
  },
  glowCyan: {
    backgroundColor: colors.accentCyan,
    top: 200,
    right: -100,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.lg,
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.glassBorder,
  },
  heading: {
    fontSize: 18,
    fontWeight: "700",
    color: colors.textPrimary,
  },
  email: {
    fontSize: 12,
    color: colors.textSecondary,
    maxWidth: 220,
  },
  logout: {
    color: colors.accentCyan,
    fontWeight: "600",
    fontSize: 13,
  },
  errorBox: {
    backgroundColor: colors.dangerBg,
    borderColor: "rgba(251,113,133,0.3)",
    borderWidth: 1,
    borderRadius: radius.sm,
    padding: 10,
    margin: spacing.lg,
  },
  errorText: {
    color: "#fecdd3",
    fontSize: 13,
  },
  loadingBox: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  listContent: {
    padding: spacing.lg,
    paddingBottom: 100,
  },
  emptyBox: {
    alignItems: "center",
    paddingVertical: 60,
  },
  emptyIcon: {
    width: 48,
    height: 48,
    borderRadius: radius.md,
    backgroundColor: colors.accent,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.md,
    shadowColor: colors.accentCyan,
    shadowOpacity: 0.4,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },
  emptyGlyph: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "700",
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: colors.textPrimary,
  },
  emptyDescription: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 4,
  },
  fab: {
    position: "absolute",
    right: spacing.xl,
    bottom: spacing.xl,
    backgroundColor: colors.accent,
    paddingHorizontal: spacing.xl,
    paddingVertical: 14,
    borderRadius: radius.pill,
    shadowColor: colors.accentCyan,
    shadowOpacity: 0.45,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 6 },
    elevation: 8,
  },
  fabText: {
    color: "#04121a",
    fontWeight: "700",
  },
});
