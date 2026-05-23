import { createFileRoute, Link } from "@tanstack/react-router";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { DashboardShell } from "@/components/DashboardShell";
import { useCallback, useEffect, useState } from "react";
import { api } from "@/lib/api";
import type { GatePass, Page } from "@/lib/types";
import { PassTable } from "@/components/PassTable";
import { PassDetailDialog } from "@/components/PassDetailDialog";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { ErrorState, getErrorMessage } from "@/components/AsyncState";
import { useAuth } from "@/lib/auth";
import { Badge } from "@/components/ui/badge";

export const Route = createFileRoute("/student/")({
  component: () => (
    <ProtectedRoute roles={["STUDENT"]}>
      <StudentHome />
    </ProtectedRoute>
  ),
});

function StudentHome() {
  const { user } = useAuth();
  const [data, setData] = useState<Page<GatePass> | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [reload, setReload] = useState(0);

  const load = useCallback(() => {
    setData(null);
    setErr(null);
    api<Page<GatePass>>("/api/passes/me", { query: { page, size: 10 } })
      .then((d) =>
        setData(d ?? { content: [], totalElements: 0, totalPages: 0, number: 0, size: 10 }),
      )
      .catch((e) => setErr(getErrorMessage(e, "Failed to load your passes")));
  }, [page]);

  useEffect(() => {
    load();
  }, [load, reload]);

  return (
    <DashboardShell title="Student Dashboard" subtitle="Track all your gate-pass requests">
      <div className="mb-4 grid gap-3 md:grid-cols-2 lg:grid-cols-4">
        <ProfileItem label="Email" value={user?.email ?? "N/A"} />
        <ProfileItem label="Enrollment No" value={user?.enrollmentNo ?? "N/A"} />
        <ProfileItem label="Hostel" value={user?.hostel ?? "N/A"} />
        <ProfileItem label="Room No" value={user?.roomNo ?? "N/A"} />
      </div>
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <Badge variant="outline" className="border-primary/40 text-primary">
          STUDENT
        </Badge>
      </div>
      <div className="mb-4 flex justify-end">
        <Button asChild>
          <Link to="/student/new">
            <Plus className="mr-1 h-4 w-4" /> New pass
          </Link>
        </Button>
      </div>
      {err ? (
        <ErrorState message={err} onRetry={load} />
      ) : (
      <PassTable
        page={data}
        onRowClick={setSelected}
        onPageChange={setPage}
        emptyText="You haven't requested any passes yet."
      />
      )}
      <PassDetailDialog
        passId={selected}
        open={!!selected}
        onOpenChange={(o) => !o && setSelected(null)}
        onChanged={() => setReload((r) => r + 1)}
      />
    </DashboardShell>
  );
}

function ProfileItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="glass rounded-lg border border-border/60 p-3">
      <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className="truncate text-sm font-medium">{value}</div>
    </div>
  );
}
