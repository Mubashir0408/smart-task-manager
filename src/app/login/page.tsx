import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { AuthCard } from "@/components/auth/AuthCard";
import { LoginForm } from "@/components/auth/LoginForm";

export const metadata: Metadata = {
  title: "Log in | TaskFlow",
};

export default function LoginPage() {
  return (
    <AuthCard
      title="Welcome back"
      subtitle="Log in to manage your tasks"
      footer={
        <>
          Don&apos;t have an account?{" "}
          <Link href="/signup" className="font-medium text-cyan-400 hover:text-cyan-300">
            Sign up
          </Link>
          <br />
          <Link href="/downloads" className="mt-1 inline-block text-slate-500 hover:text-slate-300">
            Get the app on other platforms
          </Link>
        </>
      }
    >
      <Suspense fallback={<div className="h-40" />}>
        <LoginForm />
      </Suspense>
    </AuthCard>
  );
}
