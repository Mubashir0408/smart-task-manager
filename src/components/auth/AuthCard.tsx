import type { ReactNode } from "react";
import Link from "next/link";

export function AuthCard({
  title,
  subtitle,
  footer,
  children,
}: {
  title: string;
  subtitle: string;
  footer: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden px-4 py-12">
      {/* Full-screen hero glow, layered above the fixed app-aurora background
          for extra depth specifically behind the login card. */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 60% 50% at 50% 20%, rgba(34,211,238,0.16), transparent 60%)",
        }}
        aria-hidden
      />

      <div className="animate-slide-up relative z-10 w-full max-w-md">
        <div className="mb-8 flex flex-col items-center gap-3 text-center">
          <Link href="/" className="flex items-center gap-2.5 text-xl font-semibold text-white">
            <span className="accent-gradient flex h-10 w-10 items-center justify-center rounded-2xl text-white shadow-lg shadow-blue-500/30">
              ✓
            </span>
            TaskFlow
          </Link>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-white sm:text-3xl">
              {title}
            </h1>
            <p className="mt-1.5 text-sm text-slate-400">{subtitle}</p>
          </div>
        </div>

        <div className="glass-panel-strong rounded-3xl p-6 sm:p-8">{children}</div>

        <p className="mt-6 text-center text-sm text-slate-400">{footer}</p>
      </div>
    </div>
  );
}
