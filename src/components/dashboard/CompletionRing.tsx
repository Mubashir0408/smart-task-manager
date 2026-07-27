/**
 * Single-value radial progress indicator — the "% of tasks completed" hero
 * stat. A single measure, so no legend/categorical palette is needed (per
 * the dataviz skill: a lone series needs no legend box, the label names it).
 */
export function CompletionRing({ completed, total }: { completed: number; total: number }) {
  const pct = total > 0 ? Math.round((completed / total) * 100) : 0;
  const radius = 54;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - pct / 100);

  return (
    <div className="glass-panel animate-slide-up flex items-center gap-5 rounded-2xl p-5">
      <div className="relative h-32 w-32 shrink-0">
        <svg viewBox="0 0 128 128" className="h-full w-full -rotate-90">
          <defs>
            <linearGradient id="completion-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#3b82f6" />
              <stop offset="100%" stopColor="#22d3ee" />
            </linearGradient>
          </defs>
          <circle
            cx="64"
            cy="64"
            r={radius}
            fill="none"
            stroke="rgba(255,255,255,0.08)"
            strokeWidth="12"
          />
          <circle
            cx="64"
            cy="64"
            r={radius}
            fill="none"
            stroke="url(#completion-gradient)"
            strokeWidth="12"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            className="transition-[stroke-dashoffset] duration-700 ease-out"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-2xl font-semibold text-white">{pct}%</span>
          <span className="text-[11px] text-slate-400">complete</span>
        </div>
      </div>
      <div>
        <p className="text-sm font-medium text-slate-400">Overall progress</p>
        <p className="mt-1 text-2xl font-semibold text-white">
          {completed} <span className="text-base font-normal text-slate-500">/ {total} tasks</span>
        </p>
        <p className="mt-1 text-xs text-slate-500">
          {total === 0 ? "No tasks yet" : `${total - completed} remaining`}
        </p>
      </div>
    </div>
  );
}
