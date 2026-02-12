import { cn } from "@/lib/utils";

interface ProgressBarProps {
  progress: number;
  total: number;
  className?: string;
  showLabel?: boolean;
}

export function ProgressBar({ progress, total, className, showLabel = true }: ProgressBarProps) {
  const percentage = total > 0 ? (progress / total) * 100 : 0;

  return (
    <div className={cn("space-y-1", className)}>
      {/* {showLabel && (
        // <div className="text-xs text-muted-foreground">
        //   {progress} / {total}
        // </div>
      )} */}
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-secondary">
        <div
          className="h-full rounded-full bg-primary transition-all duration-300 ease-out"
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}
