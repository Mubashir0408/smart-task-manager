import { Button } from "./Button";

export function ErrorState({
  message,
  onRetry,
}: {
  message: string;
  onRetry?: () => void;
}) {
  return (
    <div className="animate-fade-in flex flex-col items-center justify-center gap-3 rounded-3xl border border-rose-400/20 bg-rose-500/10 px-6 py-12 text-center backdrop-blur-xl">
      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-500/20 text-2xl">
        ⚠️
      </div>
      <h3 className="text-base font-semibold text-rose-100">Something went wrong</h3>
      <p className="max-w-sm text-sm text-rose-200/80">{message}</p>
      {onRetry && (
        <Button variant="secondary" size="sm" onClick={onRetry}>
          Try again
        </Button>
      )}
    </div>
  );
}
