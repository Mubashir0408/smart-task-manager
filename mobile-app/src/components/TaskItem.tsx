import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import type { Task } from "../types/task";

const STATUS_LABELS: Record<string, string> = {
  todo: "Todo",
  in_progress: "In Progress",
  completed: "Completed",
};

const STATUS_COLORS: Record<string, { bg: string; text: string }> = {
  todo: { bg: "#e0e7ff", text: "#3730a3" },
  in_progress: { bg: "#fef3c7", text: "#92400e" },
  completed: { bg: "#d1fae5", text: "#065f46" },
};

const PRIORITY_COLORS: Record<string, { bg: string; text: string }> = {
  low: { bg: "#f1f5f9", text: "#475569" },
  medium: { bg: "#e0f2fe", text: "#0369a1" },
  high: { bg: "#fee2e2", text: "#b91c1c" },
};

interface TaskItemProps {
  task: Task;
  onEdit: (task: Task) => void;
  onDelete: (id: string) => void;
}

export function TaskItem({ task, onEdit, onDelete }: TaskItemProps) {
  const statusColor = STATUS_COLORS[task.status];
  const priorityColor = PRIORITY_COLORS[task.priority];

  return (
    <TouchableOpacity style={styles.card} onPress={() => onEdit(task)} activeOpacity={0.7}>
      <View style={styles.row}>
        <Text style={styles.title} numberOfLines={1}>
          {task.title}
        </Text>
        <TouchableOpacity onPress={() => onDelete(task.id)} hitSlop={8}>
          <Text style={styles.delete}>Delete</Text>
        </TouchableOpacity>
      </View>

      {task.description ? (
        <Text style={styles.description} numberOfLines={2}>
          {task.description}
        </Text>
      ) : null}

      <View style={styles.badgeRow}>
        <View style={[styles.badge, { backgroundColor: statusColor.bg }]}>
          <Text style={[styles.badgeText, { color: statusColor.text }]}>
            {STATUS_LABELS[task.status]}
          </Text>
        </View>
        <View style={[styles.badge, { backgroundColor: priorityColor.bg }]}>
          <Text style={[styles.badgeText, { color: priorityColor.text }]}>
            {task.priority.toUpperCase()}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#fff",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#eef0f3",
    padding: 14,
    marginBottom: 10,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  title: {
    fontSize: 15,
    fontWeight: "600",
    color: "#1f2937",
    flex: 1,
    marginRight: 8,
  },
  delete: {
    color: "#dc2626",
    fontSize: 12,
    fontWeight: "600",
  },
  description: {
    fontSize: 13,
    color: "#6b7280",
    marginTop: 4,
  },
  badgeRow: {
    flexDirection: "row",
    gap: 8,
    marginTop: 10,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: "700",
  },
});
