interface DownloadCardProps {
  icon: string;
  title: string;
  description: string;
  fileName?: string;
  available?: boolean;
}

export function DownloadCard({ icon, title, description, fileName, available }: DownloadCardProps) {
  const canDownload = Boolean(fileName) && available;

  return (
    <div className="glass-panel animate-slide-up flex flex-col items-start gap-4 rounded-3xl p-6 transition-transform duration-200 hover:-translate-y-1">
      <div className="accent-gradient flex h-14 w-14 items-center justify-center rounded-2xl text-2xl shadow-lg shadow-blue-500/25">
        <span aria-hidden>{icon}</span>
      </div>

      <div>
        <h3 className="text-lg font-semibold text-white">{title}</h3>
        <p className="mt-1 text-sm text-slate-400">{description}</p>
      </div>

      {canDownload ? (
        <a
          href={`/downloads/${fileName}`}
          download
          className="accent-gradient mt-auto inline-flex w-full items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium text-white shadow-lg shadow-blue-500/20 transition-all duration-200 hover:shadow-blue-500/40 hover:brightness-110 active:scale-[0.97]"
        >
          ⬇ Download
        </a>
      ) : (
        <div className="mt-auto flex w-full items-center justify-center gap-2 rounded-full bg-amber-400/15 px-4 py-2.5 text-sm font-semibold text-amber-300 ring-1 ring-inset ring-amber-400/25">
          <span className="h-1.5 w-1.5 rounded-full bg-amber-400" aria-hidden />
          Coming Soon
        </div>
      )}
    </div>
  );
}
