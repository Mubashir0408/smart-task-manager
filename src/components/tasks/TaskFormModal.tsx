"use client";

import { useEffect, useState, type FormEvent } from "react";
import { Modal } from "../ui/Modal";
import { Input } from "../ui/Input";
import { Textarea } from "../ui/Textarea";
import { Select } from "../ui/Select";
import { Button } from "../ui/Button";
import { validateTaskForm, type TaskFormErrors, type TaskFormValues } from "@/utils/validation";
import { toDateInputValue } from "@/utils/date";
import type { Task, TaskInsert, TaskPriority, TaskStatus, TaskUpdate } from "@/types/task";

const EMPTY_VALUES: TaskFormValues = {
  title: "",
  description: "",
  status: "todo",
  priority: "medium",
  due_date: "",
};

interface TaskFormModalProps {
  open: boolean;
  task?: Task | null;
  isSubmitting: boolean;
  onClose: () => void;
  onSubmit: (values: TaskInsert | TaskUpdate) => Promise<unknown>;
}

export function TaskFormModal({ open, task, isSubmitting, onClose, onSubmit }: TaskFormModalProps) {
  const isEdit = Boolean(task);
  const [values, setValues] = useState<TaskFormValues>(EMPTY_VALUES);
  const [errors, setErrors] = useState<TaskFormErrors>({});

  useEffect(() => {
    if (!open) return;
    setValues(
      task
        ? {
            title: task.title,
            description: task.description ?? "",
            status: task.status,
            priority: task.priority,
            due_date: toDateInputValue(task.due_date),
          }
        : EMPTY_VALUES
    );
    setErrors({});
  }, [open, task]);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    const validationErrors = validateTaskForm(values);
    setErrors(validationErrors);
    if (Object.keys(validationErrors).length > 0) return;

    try {
      await onSubmit({
        title: values.title,
        description: values.description,
        status: values.status as TaskStatus,
        priority: values.priority as TaskPriority,
        due_date: values.due_date || null,
      });
      onClose();
    } catch {
      // Error is already surfaced via toast by the calling hook; keep the
      // modal open so the user can retry without re-entering the form.
    }
  };

  return (
    <Modal open={open} onClose={onClose} title={isEdit ? "Edit task" : "New task"}>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
        <Input
          label="Title"
          name="title"
          value={values.title}
          onChange={(e) => setValues((v) => ({ ...v, title: e.target.value }))}
          error={errors.title}
          placeholder="e.g. Finish project proposal"
          autoFocus
        />
        <Textarea
          label="Description"
          name="description"
          rows={3}
          value={values.description}
          onChange={(e) => setValues((v) => ({ ...v, description: e.target.value }))}
          error={errors.description}
          placeholder="Add more detail (optional)"
        />
        <div className="grid grid-cols-2 gap-4">
          <Select
            label="Priority"
            name="priority"
            value={values.priority}
            onChange={(e) => setValues((v) => ({ ...v, priority: e.target.value }))}
          >
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
          </Select>
          <Input
            label="Due date"
            type="date"
            name="due_date"
            value={values.due_date}
            onChange={(e) => setValues((v) => ({ ...v, due_date: e.target.value }))}
          />
        </div>
        {isEdit && (
          <Select
            label="Status"
            name="status"
            value={values.status}
            onChange={(e) => setValues((v) => ({ ...v, status: e.target.value }))}
          >
            <option value="todo">To Do</option>
            <option value="in_progress">In Progress</option>
            <option value="completed">Completed</option>
          </Select>
        )}
        <div className="mt-2 flex justify-end gap-3">
          <Button type="button" variant="secondary" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button type="submit" isLoading={isSubmitting}>
            {isEdit ? "Save changes" : "Create task"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
