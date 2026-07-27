"use client";

import { usePathname } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { LogoutButton } from "../auth/LogoutButton";

const TITLES: Record<string, string> = {
  "/dashboard": "Dashboard",
  "/tasks": "Tasks",
};

export function TopNav({ onMenuClick }: { onMenuClick: () => void }) {
  const pathname = usePathname();
  const { user } = useAuth();
  const title = TITLES[pathname] ?? "TaskFlow";

  return (
    <header className="glass-panel sticky top-3 z-20 mx-3 mt-3 flex h-16 items-center justify-between rounded-2xl px-4 sm:px-6 lg:mx-0 lg:mr-6">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onMenuClick}
          className="rounded-lg p-2 text-slate-400 transition hover:bg-white/10 hover:text-white lg:hidden"
          aria-label="Open menu"
        >
          ☰
        </button>
        <h1 className="text-lg font-semibold text-white">{title}</h1>
      </div>
      <div className="flex items-center gap-3">
        <span className="hidden text-sm text-slate-400 sm:inline">{user?.email}</span>
        <LogoutButton />
      </div>
    </header>
  );
}
