"use client";

import { createContext, useContext } from "react";

export type ToastVariant = "success" | "error" | "info";

export interface ToastMessage {
  id: string;
  variant: ToastVariant;
  message: string;
}

export interface ToastContextValue {
  toasts: ToastMessage[];
  showToast: (variant: ToastVariant, message: string) => void;
  dismissToast: (id: string) => void;
}

export const ToastContext = createContext<ToastContextValue | null>(null);

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return ctx;
}
