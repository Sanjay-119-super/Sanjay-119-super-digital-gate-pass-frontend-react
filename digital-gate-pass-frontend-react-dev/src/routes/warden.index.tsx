import { createFileRoute } from "@tanstack/react-router";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { DashboardShell } from "@/components/DashboardShell";
import { useCallback, useEffect, useState } from "react";
import { api, ApiError } from "@/lib/api";
import type { GatePass, Page } from "@/lib/types";
import { PassTable } from "@/components/PassTable";
import { PassDetailDialog } from "@/components/PassDetailDialog";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Check, X, Loader2 } from "lucide-react";
import toast from "react-hot-toast";
import { displayName } from "@/lib/display";
import { ErrorState, getErrorMessage } from "@/components/AsyncState";

export const Route = createFileRoute("/warden/")({
  component: () => (
    <ProtectedRoute roles={["WARDEN", "ADMIN"]}>
      <WardenHome />
    </ProtectedRoute>
  ),
});

function WardenHome() {
  const [data, setData] = useState<Page<GatePass> | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [decision, setDecision] = useState<{
    pass: GatePass;
    action: "approve" | "reject";
  } | null>(null);
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [reload, setReload] = useState(0);

  const load = useCallback(() => {
    setData(null);
    setErr(null);
    api<Page<GatePass>>("/api/passes/pending", { query: { page, size: 10 } })
      .then((d) =>
        setData(d ?? { content: [], totalElements: 0, totalPages: 0, number: 0, size: 10 }),
      )
      .catch((e) => setErr(getErrorMessage(e, "Failed to load pending requests")));
  }, [page]);

  useEffect(() => {
    load();
  }, [load, reload]);

  const submitDecision = async () => {
    if (!decision || submitting) return;
    if (decision.action === "reject" && note.trim().length < 10) {
      toast.error("Rejection reason must be at least 10 characters");
      return;
    }
    setSubmitting(true);
    try {
      await api(`/api/passes/${decision.pass.id}/${decision.action}`, {
        method: "POST",
        body: note ? { note } : undefined,
      });
      toast.success(decision.action === "approve" ? "Approved" : "Rejected");
      setDecision(null);
      setNote("");
      setReload((r) => r + 1);
    } catch (e) {
      if (e instanceof ApiError && e.status === 409) {
        toast.error("This pass was just modified by someone else. Please refresh and try again.");
      } else {
        toast.error(getErrorMessage(e, "Action failed"));
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <DashboardShell title="Warden Dashboard" subtitle="Review and approve pending gate pass requests">
      <Tabs defaultValue="pending" className="w-full">
        <TabsList>
          <TabsTrigger value="pending">Pending Requests</TabsTrigger>
          <TabsTrigger value="returned">Returned Today</TabsTrigger>
        </TabsList>
        <TabsContent value="pending" className="mt-4">
          {err ? (
            <ErrorState message={err} onRetry={load} />
          ) : (
            <PassTable
              page={data}
              showStudent
              onRowClick={setSelected}
              onPageChange={setPage}
              emptyText="No pending requests right now."
              rightAction={(p) => (
                <div className="flex justify-end gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    className="border-success/50 text-success hover:bg-success/10"
                    onClick={() => setDecision({ pass: p, action: "approve" })}
                  >
                    <Check className="h-4 w-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="border-destructive/50 text-destructive hover:bg-destructive/10"
                    onClick={() => setDecision({ pass: p, action: "reject" })}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              )}
            />
          )}
        </TabsContent>
        <TabsContent value="returned" className="mt-4">
          <ReturnedPassesTab onRowClick={setSelected} />
        </TabsContent>
      </Tabs>
      <PassDetailDialog
        passId={selected}
        open={!!selected}
        onOpenChange={(o) => !o && setSelected(null)}
        onChanged={() => setReload((r) => r + 1)}
      />
      <Dialog
        open={!!decision}
        onOpenChange={(o) => {
          if (submitting) return;
          if (!o) {
            setDecision(null);
            setNote("");
          }
        }}
      >
        <DialogContent className="glass">
          <DialogHeader>
            <DialogTitle>
              {decision?.action === "approve" ? "Approve pass" : "Reject pass"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-2 text-sm">
            <p className="text-muted-foreground">
              For <span className="font-medium text-foreground">{decision?.pass?.studentName ?? "Unknown"}</span>{" "}
              — {decision?.pass?.reason ?? "N/A"}
            </p>
            <Textarea
              placeholder="Optional note..."
              value={note}
              onChange={(e) => setNote(e.target.value)}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" disabled={submitting} onClick={() => setDecision(null)}>
              Cancel
            </Button>
            <Button
              variant={decision?.action === "approve" ? "default" : "destructive"}
              disabled={submitting}
              onClick={submitDecision}
            >
              {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Confirm
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardShell>
  );
}

function ReturnedPassesTab({ onRowClick }: { onRowClick: (id: number) => void }) {
  const [data, setData] = useState<Page<GatePass> | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    api<Page<GatePass>>("/api/passes/returned", { query: { page: 0, size: 20 } })
      .then((d) =>
        setData(d ?? { content: [], totalElements: 0, totalPages: 0, number: 0, size: 20 }),
      )
      .catch(() => {
        setErr("Returned passes list requires backend /api/passes/returned endpoint.");
      });
  }, []);

  if (err) {
    return (
      <div className="glass rounded-xl border border-border/60 p-6 text-sm text-muted-foreground">
        {err}
      </div>
    );
  }
  return (
    <PassTable
      page={data}
      showStudent
      onRowClick={onRowClick}
      emptyText="No students have returned yet today."
    />
  );
}
