export function WelcomeBanner({ email }: { email: string | undefined }) {
  const name = email?.split("@")[0] ?? "there";
  return (
    <div className="accent-gradient animate-slide-up relative overflow-hidden rounded-3xl p-6 text-white shadow-xl shadow-blue-500/20 sm:p-8">
      <div
        className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-white/10 blur-2xl"
        aria-hidden
      />
      <h2 className="text-xl font-semibold sm:text-2xl">Welcome back, {name} 👋</h2>
      <p className="mt-1 text-sm text-white/80">
        Here&apos;s what&apos;s happening with your tasks today.
      </p>
    </div>
  );
}
