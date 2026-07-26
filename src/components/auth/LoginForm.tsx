"use client";

import { useMemo, useState, type FormEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { validateAuthForm, type AuthFormErrors } from "@/utils/validation";
import { Input } from "../ui/Input";
import { Button } from "../ui/Button";

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = useMemo(() => createClient(), []);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<AuthFormErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setFormError(null);

    const validationErrors = validateAuthForm({ email, password });
    setErrors(validationErrors);
    if (Object.keys(validationErrors).length > 0) return;

    setIsSubmitting(true);
    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });
    setIsSubmitting(false);

    if (error) {
      setFormError(
        error.message === "Invalid login credentials"
          ? "Incorrect email or password."
          : error.message
      );
      return;
    }

    // Navigating to a different route (the redirect target vs. this /login
    // page) already triggers a fresh server render — middleware and
    // ProtectedLayout re-run and pick up the session cookies
    // signInWithPassword() just set. A follow-up router.refresh() would
    // just repeat that same round trip a second time before the dashboard
    // ever gets a chance to paint, roughly doubling perceived login time.
    const redirectTo = searchParams.get("redirectTo") || "/dashboard";
    router.push(redirectTo);
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
      {formError && (
        <div
          role="alert"
          className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700"
        >
          {formError}
        </div>
      )}
      <Input
        label="Email"
        type="email"
        name="email"
        autoComplete="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        error={errors.email}
        placeholder="you@example.com"
      />
      <Input
        label="Password"
        type="password"
        name="password"
        autoComplete="current-password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        error={errors.password}
        placeholder="••••••••"
      />
      <Button type="submit" isLoading={isSubmitting} className="mt-2">
        Log in
      </Button>
    </form>
  );
}
