export interface TaskFormValues {
  title: string;
  description: string;
  status: string;
  priority: string;
  due_date: string;
}

export type TaskFormErrors = Partial<Record<keyof TaskFormValues, string>>;

export function validateTaskForm(values: TaskFormValues): TaskFormErrors {
  const errors: TaskFormErrors = {};

  if (!values.title.trim()) {
    errors.title = "Title is required.";
  } else if (values.title.trim().length > 200) {
    errors.title = "Title must be 200 characters or fewer.";
  }

  if (values.description.trim().length > 2000) {
    errors.description = "Description must be 2000 characters or fewer.";
  }

  return errors;
}

export interface AuthFormValues {
  email: string;
  password: string;
}

export type AuthFormErrors = Partial<Record<keyof AuthFormValues, string>>;

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function validateAuthForm(
  values: AuthFormValues,
  options: { minPasswordLength?: number } = {}
): AuthFormErrors {
  const errors: AuthFormErrors = {};
  const minLength = options.minPasswordLength ?? 6;

  if (!values.email.trim()) {
    errors.email = "Email is required.";
  } else if (!EMAIL_PATTERN.test(values.email.trim())) {
    errors.email = "Enter a valid email address.";
  }

  if (!values.password) {
    errors.password = "Password is required.";
  } else if (values.password.length < minLength) {
    errors.password = `Password must be at least ${minLength} characters.`;
  }

  return errors;
}
