import { Button } from "@/components/ui/button";
import { Loader2, AlertTriangle, Inbox } from "lucide-react";
import type { ReactNode } from "react";

export function LoadingState({ label = "Loading…" }: { label?: string }) {
  return (
    <div className="flex items-center justify-center gap-2 py-10 text-sm text-muted-foreground">
      <Loader2 className="h-4 w-4 animate-spin" /> {label}
    </div>
  );
}

export function ErrorState({
  message,
  onRetry,
}: {
  message?: string;
  onRetry?: () => void;
}) {
  return (
    <div className="glass flex flex-col items-center justify-center gap-3 rounded-xl border border-destructive/30 p-8 text-center">
      <AlertTriangle className="h-6 w-6 text-destructive" />
      <div className="text-sm text-muted-foreground">
        {message || "Something went wrong while loading this section."}
      </div>
      {onRetry && (
        <Button size="sm" variant="outline" onClick={onRetry}>
          Retry
        </Button>
      )}
    </div>
  );
}

export function EmptyState({
  title = "No records found",
  description,
  action,
}: {
  title?: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="glass flex flex-col items-center justify-center gap-2 rounded-xl border border-border/50 p-10 text-center">
      <Inbox className="h-8 w-8 text-muted-foreground" />
      <div className="text-sm font-medium">{title}</div>
      {description && (
        <div className="text-xs text-muted-foreground">{description}</div>
      )}
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}

export function getErrorMessage(e: unknown, fallback = "Something went wrong"): string {
  if (!e) return fallback;
  if (e instanceof Error) return e.message || fallback;
  if (typeof e === "string") return e;
  if (typeof e === "object") {
    const msg = (e as { message?: unknown }).message;
    if (typeof msg === "string") return msg;
  }
  return fallback;
}