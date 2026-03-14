interface ProgressBarProps {
  progress: number;
  size?: 'sm' | 'md';
  showLabel?: boolean;
  colorClass?: string;
}

export function ProgressBar({
  progress,
  size = 'md',
  showLabel = true,
  colorClass = 'from-indigo-400 to-indigo-600',
}: ProgressBarProps) {
  const height = size === 'sm' ? 'h-1.5' : 'h-2';
  const clamped = Math.min(Math.max(progress, 0), 100);

  return (
    <div className="w-full">
      <div className={`w-full bg-slate-100 rounded-full overflow-hidden ${height}`}>
        <div
          className={`h-full bg-gradient-to-r ${colorClass} rounded-full transition-all duration-500`}
          style={{ width: `${clamped}%` }}
        />
      </div>
      {showLabel && (
        <p className="text-xs text-slate-500 mt-1">Progreso: {clamped}%</p>
      )}
    </div>
  );
}
