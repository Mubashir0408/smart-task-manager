export function WelcomeBanner({ email }: { email: string | undefined }) {
  const name = email?.split("@")[0] ?? "there";
  return (
    <div className="rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-500 p-6 text-white shadow-sm sm:p-8">
      <h2 className="text-xl font-semibold sm:text-2xl">Welcome back, {name} 👋</h2>
      <p className="mt-1 text-sm text-indigo-100">
        Here&apos;s what&apos;s happening with your tasks today.
      </p>
    </div>
  );
}
