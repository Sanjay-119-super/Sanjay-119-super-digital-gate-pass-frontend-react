import { createFileRoute, Link } from "@tanstack/react-router";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { DashboardShell } from "@/components/DashboardShell";
import { useCallback, useEffect, useState } from "react";
import { api } from "@/lib/api";
import type { DashboardStats, GatePass, Page } from "@/lib/types";
import { StatsCard } from "@/components/StatsCard";
import { PassTable } from "@/components/PassTable";
import { PassDetailDialog } from "@/components/PassDetailDialog";
import { ErrorState } from "@/components/AsyncState";
import { getErrorMessage } from "@/components/AsyncState";
import {
  ClipboardList,
  Hourglass,
  CheckCircle2,
  Users,
  AlertTriangle,
  ArrowRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/admin/")({
  component: () => (
    <ProtectedRoute roles={["ADMIN"]}>
      <AdminDashboard />
    </ProtectedRoute>
  ),
});

function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [statsErr, setStatsErr] = useState<string | null>(null);
  const [pending, setPending] = useState<Page<GatePass> | null>(null);
  const [pendingErr, setPendingErr] = useState<string | null>(null);
  const [selected, setSelected] = useState<number | null>(null);
  const [reload, setReload] = useState(0);

  const loadStats = useCallback(() => {
    setStatsErr(null);
    setStats(null);
    api<DashboardStats>("/api/admin/dashboard")
      .then((d) => setStats(d ?? null))
      .catch((e) => setStatsErr(getErrorMessage(e, "Failed to load stats")));
  }, []);

  const loadPending = useCallback(() => {
    setPendingErr(null);
    setPending(null);
    api<Page<GatePass>>("/api/passes/pending", { query: { page: 0, size: 5 } })
      .then((d) => setPending(d ?? { content: [], totalElements: 0, totalPages: 0, number: 0, size: 5 }))
      .catch((e) => setPendingErr(getErrorMessage(e, "Failed to load pending passes")));
  }, []);

  useEffect(() => {
    loadStats();
    loadPending();
  }, [loadStats, loadPending, reload]);

  return (
    <DashboardShell title="Admin Dashboard" subtitle="Realtime overview of campus gate activity">
      {statsErr ? (
        <ErrorState message={statsErr} onRetry={loadStats} />
      ) : (
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        <StatsCard label="Total passes" value={stats?.totalPasses ?? 0} icon={ClipboardList} />
        <StatsCard label="Pending" value={stats?.pendingCount ?? 0} icon={Hourglass} tone="warning" />
        <StatsCard
          label="Approved today"
          value={stats?.approvedToday ?? 0}
          icon={CheckCircle2}
          tone="success"
        />
        <StatsCard label="Currently out" value={stats?.currentlyOut ?? 0} icon={Users} />
        <StatsCard
          label="Expired today"
          value={stats?.expiredToday ?? 0}
          icon={AlertTriangle}
          tone="destructive"
        />
      </div>
      )}

      <div className="mt-8">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            Pending requests
          </h2>
          <Button asChild variant="ghost" size="sm">
            <Link to="/warden">
              View all <ArrowRight className="ml-1 h-3.5 w-3.5" />
            </Link>
          </Button>
        </div>
        {pendingErr ? (
          <ErrorState message={pendingErr} onRetry={loadPending} />
        ) : (
          <PassTable
            page={pending}
            showStudent
            onRowClick={setSelected}
            emptyText="Nothing pending. All clear."
          />
        )}
      </div>

      <PassDetailDialog
        passId={selected}
        open={!!selected}
        onOpenChange={(o) => !o && setSelected(null)}
        onChanged={() => setReload((r) => r + 1)}
      />
    </DashboardShell>
  );
}
