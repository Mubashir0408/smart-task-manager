import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import type { Task } from "../types/task";
import { colors, glassPanel, radius, spacing } from "../theme";

const STATUS_LABELS: Record<string, string> = {
  todo: "Todo",
  in_progress: "In Progress",
  completed: "Completed",
};

interface TaskItemProps {
  task: Task;
  onEdit: (task: Task) => void;
  onDelete: (id: string) => void;
}

export function TaskItem({ task, onEdit, onDelete }: TaskItemProps) {
  const statusColor = colors.status[task.status as keyof typeof colors.status];
  const priorityColor = colors.priority[task.priority as keyof typeof colors.priority];

  return (
    <TouchableOpacity style={styles.card} onPress={() => onEdit(task)} activeOpacity={0.8}>
      <View style={[styles.accentStrip, { backgroundColor: priorityColor.accent }]} />

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
          <Text style={[styles.badgeText, { color: statusColor.fg }]}>
            {STATUS_LABELS[task.status]}
          </Text>
        </View>
        <View style={[styles.badge, { backgroundColor: priorityColor.bg }]}>
          <Text style={[styles.badgeText, { color: priorityColor.fg }]}>
            {task.priority.toUpperCase()}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    ...glassPanel,
    padding: spacing.md + 2,
    marginBottom: spacing.md,
    overflow: "hidden",
  },
  accentStrip: {
    position: "absolute",
    left: 0,
    top: 0,
    bottom: 0,
    width: 4,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginLeft: spacing.xs,
  },
  title: {
    fontSize: 15,
    fontWeight: "600",
    color: colors.textPrimary,
    flex: 1,
    marginRight: spacing.sm,
  },
  delete: {
    color: colors.danger,
    fontSize: 12,
    fontWeight: "600",
  },
  description: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 4,
    marginLeft: spacing.xs,
  },
  badgeRow: {
    flexDirection: "row",
    gap: spacing.sm,
    marginTop: spacing.sm + 2,
    marginLeft: spacing.xs,
  },
  badge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: radius.pill,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: "700",
  },
});
