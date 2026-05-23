import type { PassStatus } from "@/lib/types";
import { cn } from "@/lib/utils";

const styles: Record<PassStatus, string> = {
  PENDING: "bg-warning/15 text-warning border-warning/30",
  APPROVED: "bg-success/15 text-success border-success/30",
  REJECTED: "bg-destructive/15 text-destructive border-destructive/30",
  CANCELLED: "bg-muted text-muted-foreground border-border",
  USED: "bg-primary/15 text-primary border-primary/30",
  RETURNED: "bg-success/15 text-success border-success/30",
  EXPIRED: "bg-destructive/10 text-destructive/80 border-destructive/20",
};

export function StatusBadge({ status }: { status?: PassStatus | string | null }) {
  const key = (status ?? "UNKNOWN") as PassStatus;
  const style = styles[key] ?? "bg-muted text-muted-foreground border-border";
  const label = String(status ?? "UNKNOWN");
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium tracking-wide",
        style,
      )}
    >
      {label}
    </span>
  );
}
