import { Card, CardContent } from "@/components/ui/card";
import CountUp from "react-countup";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export function StatsCard({
  label,
  value,
  icon: Icon,
  tone = "primary",
}: {
  label: string;
  value: number;
  icon: LucideIcon;
  tone?: "primary" | "success" | "warning" | "destructive";
}) {
  const tones = {
    primary: "from-primary/30 to-primary/0 text-primary",
    success: "from-success/30 to-success/0 text-success",
    warning: "from-warning/30 to-warning/0 text-warning",
    destructive: "from-destructive/30 to-destructive/0 text-destructive",
  };
  return (
    <Card className="glass overflow-hidden border-border/60">
      <CardContent className="relative p-5">
        <div
          className={cn(
            "absolute inset-0 bg-gradient-to-br opacity-60",
            tones[tone],
          )}
        />
        <div className="relative flex items-start justify-between">
          <div>
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              {label}
            </p>
            <p className="mt-2 text-3xl font-semibold tracking-tight">
              <CountUp end={value} duration={1.2} preserveValue />
            </p>
          </div>
          <div className={cn("rounded-xl bg-background/40 p-2.5", tones[tone])}>
            <Icon className="h-5 w-5" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
