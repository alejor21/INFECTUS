interface ProgressBarProps {
  progress: number;
  size?: 'sm' | 'md';
  showLabel?: boolean;
}

export function ProgressBar({ progress, size = 'md', showLabel = true }: ProgressBarProps) {
  const height = size === 'sm' ? 'h-1.5' : 'h-2';
  
  return (
    <div className="w-full">
      <div className={`w-full bg-slate-100 rounded-full overflow-hidden ${height}`}>
        <div
          className="h-full bg-gradient-to-r from-blue-500 to-blue-600 rounded-full transition-all duration-300"
          style={{ width: `${Math.min(progress, 100)}%` }}
        />
      </div>
      {showLabel && (
        <p className="text-xs text-slate-500 mt-1">
          Progreso: {progress}%
        </p>
      )}
    </div>
  );
}
