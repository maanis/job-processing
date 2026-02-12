import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium transition-colors",
  {
    variants: {
      variant: {
        default: "bg-secondary text-secondary-foreground",
        queued: "bg-muted text-muted-foreground",
        processing: "bg-primary/10 text-primary",
        completed: "bg-success/10 text-success",
        completed_with_errors: "bg-warning/10 text-warning",
        failed: "bg-destructive/10 text-destructive",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
  VariantProps<typeof badgeVariants> { }

export function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <span className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}

export function StatusBadge({ status }: { status: string }) {
  const labels: Record<string, string> = {
    queued: 'Queued',
    processing: 'Processing',
    completed: 'Completed',
    completed_with_errors: 'Completed with errors',
    failed: 'Failed',
  };

  return (
    <Badge variant={status as BadgeProps['variant']}>
      {labels[status] || status}
    </Badge>
  );
}
