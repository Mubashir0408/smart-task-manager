import { forwardRef, type ButtonHTMLAttributes } from "react";
import { cn } from "@/utils/cn";
import { Spinner } from "./Spinner";

type Variant = "primary" | "secondary" | "danger" | "ghost";
type Size = "sm" | "md";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  isLoading?: boolean;
}

const VARIANT_STYLES: Record<Variant, string> = {
  primary:
    "accent-gradient text-white shadow-lg shadow-blue-500/20 hover:shadow-blue-500/40 hover:brightness-110 focus-visible:outline-cyan-400 disabled:opacity-50 disabled:hover:brightness-100",
  secondary:
    "glass-panel text-slate-100 hover:bg-white/10 hover:border-white/25 focus-visible:outline-cyan-400 disabled:opacity-40",
  danger:
    "bg-rose-500/90 text-white shadow-lg shadow-rose-500/20 hover:bg-rose-500 focus-visible:outline-rose-400 disabled:opacity-50",
  ghost:
    "bg-transparent text-slate-300 hover:bg-white/10 hover:text-white focus-visible:outline-cyan-400 disabled:opacity-40",
};

const SIZE_STYLES: Record<Size, string> = {
  sm: "px-3 py-1.5 text-sm",
  md: "px-4 py-2.5 text-sm",
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    { className, variant = "primary", size = "md", isLoading, disabled, children, ...props },
    ref
  ) => {
    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={cn(
          "inline-flex items-center justify-center gap-2 rounded-xl font-medium transition-all duration-200 ease-out active:scale-[0.97] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 disabled:cursor-not-allowed disabled:active:scale-100",
          VARIANT_STYLES[variant],
          SIZE_STYLES[size],
          className
        )}
        {...props}
      >
        {isLoading && <Spinner size="sm" />}
        {children}
      </button>
    );
  }
);

Button.displayName = "Button";
