"use client";

import type { TaskFilters as TaskFiltersType } from "@/types/task";
import { Input } from "../ui/Input";
import { Select } from "../ui/Select";

interface TaskFiltersProps {
  filters: TaskFiltersType;
  onChange: (filters: TaskFiltersType) => void;
}

export function TaskFilters({ filters, onChange }: TaskFiltersProps) {
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
      <Input
        aria-label="Search tasks by title"
        placeholder="Search by title..."
        value={filters.search}
        onChange={(e) => onChange({ ...filters, search: e.target.value })}
      />
      <Select
        aria-label="Filter by status"
        value={filters.status}
        onChange={(e) =>
          onChange({ ...filters, status: e.target.value as TaskFiltersType["status"] })
        }
      >
        <option value="all">All statuses</option>
        <option value="todo">To Do</option>
        <option value="in_progress">In Progress</option>
        <option value="completed">Completed</option>
      </Select>
      <Select
        aria-label="Filter by priority"
        value={filters.priority}
        onChange={(e) =>
          onChange({ ...filters, priority: e.target.value as TaskFiltersType["priority"] })
        }
      >
        <option value="all">All priorities</option>
        <option value="low">Low</option>
        <option value="medium">Medium</option>
        <option value="high">High</option>
      </Select>
      <Select
        aria-label="Sort tasks"
        value={filters.sort}
        onChange={(e) =>
          onChange({ ...filters, sort: e.target.value as TaskFiltersType["sort"] })
        }
      >
        <option value="newest">Newest first</option>
        <option value="oldest">Oldest first</option>
        <option value="due_date">Due date</option>
        <option value="priority">Priority</option>
      </Select>
    </div>
  );
}
