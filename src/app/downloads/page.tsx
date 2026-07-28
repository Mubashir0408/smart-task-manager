import fs from "node:fs";
import path from "node:path";
import type { Metadata } from "next";
import Link from "next/link";
import { DownloadCard } from "@/components/downloads/DownloadCard";

export const metadata: Metadata = {
  title: "Downloads | TaskFlow",
};

const APPS = [
  {
    icon: "🪟",
    title: "Windows Desktop",
    description: "Install the native Windows desktop app, built with Tauri.",
    fileName: "TaskFlow-Setup.exe",
  },
  {
    icon: "🧩",
    title: "Chrome Extension",
    description: "Quickly add and sync tasks from your browser toolbar.",
    fileName: "TaskFlow-Chrome-Extension.zip",
  },
  {
    icon: "🤖",
    title: "Android App",
    description: "Manage your tasks natively on Android.",
    fileName: undefined,
  },
] as const;

function fileExists(fileName?: string) {
  return Boolean(fileName) && fs.existsSync(path.join(process.cwd(), "public", "downloads", fileName!));
}

export default function DownloadsPage() {
  return (
    <div className="relative min-h-screen px-4 py-16 sm:py-20">
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 60% 50% at 50% 10%, rgba(34,211,238,0.14), transparent 60%)",
        }}
        aria-hidden
      />

      <div className="relative z-10 mx-auto max-w-5xl">
        <div className="mb-12 flex flex-col items-center gap-3 text-center">
          <Link href="/" className="flex items-center gap-2.5 text-xl font-semibold text-white">
            <span className="accent-gradient flex h-10 w-10 items-center justify-center rounded-2xl text-white shadow-lg shadow-blue-500/30">
              ✓
            </span>
            TaskFlow
          </Link>
          <h1 className="text-3xl font-semibold tracking-tight text-white sm:text-4xl">
            Get TaskFlow on every device
          </h1>
          <p className="max-w-xl text-sm text-slate-400 sm:text-base">
            Download the app for your platform. Every client syncs to the same account in real
            time.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {APPS.map((app) => (
            <DownloadCard
              key={app.title}
              icon={app.icon}
              title={app.title}
              description={app.description}
              fileName={app.fileName}
              available={fileExists(app.fileName)}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
