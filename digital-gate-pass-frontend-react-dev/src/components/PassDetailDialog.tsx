import { useEffect, useState } from "react";
import { api, ApiError } from "@/lib/api";
import type { ApprovalLog, GatePass } from "@/lib/types";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { StatusBadge } from "./StatusBadge";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { Download, X, History, Loader2 } from "lucide-react";
import toast from "react-hot-toast";
import { API_URL, tokenStore } from "@/lib/api";
import { getErrorMessage, ErrorState } from "@/components/AsyncState";
import { compressToken } from "@/lib/display";

export function PassDetailDialog({
  passId,
  open,
  onOpenChange,
  onChanged,
}: {
  passId: number | null;
  open: boolean;
  onOpenChange: (o: boolean) => void;
  onChanged?: () => void;
}) {
  const [pass, setPass] = useState<GatePass | null>(null);
  const [history, setHistory] = useState<ApprovalLog[]>([]);
  const [qr, setQr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [cancelling, setCancelling] = useState(false);

  useEffect(() => {
    if (!open || !passId) return;
    setLoading(true);
    setErr(null);
    setPass(null);
    setHistory([]);
    setQr(null);
    Promise.all([
      api<GatePass>(`/api/passes/${passId}`),
      api<ApprovalLog[]>(`/api/passes/${passId}/history`).catch(() => []),
    ])
      .then(async ([p, h]) => {
        setPass(p);
        setHistory(Array.isArray(h) ? h : []);
        if (p && (p.status === "APPROVED" || p.status === "USED")) {
          try {
            const data = await api<{ imageBase64: string }>(`/api/passes/${p.id}/qr/data`);
            if (data?.imageBase64) setQr(`data:image/png;base64,${data.imageBase64}`);
          } catch {
            // ignore
          }
        }
      })
      .catch((e) => setErr(getErrorMessage(e, "Failed to load pass")))
      .finally(() => setLoading(false));
  }, [open, passId]);

  const cancel = async () => {
    if (!pass || cancelling) return;
    setCancelling(true);
    try {
      await api(`/api/passes/${pass.id}/cancel`, { method: "POST" });
      toast.success("Pass cancelled");
      onOpenChange(false);
      onChanged?.();
    } catch (e) {
      if (e instanceof ApiError && e.status === 409) {
        toast.error("This pass was just modified by someone else. Please refresh and try again.");
      } else {
        toast.error(getErrorMessage(e, "Cancel failed"));
      }
    } finally {
      setCancelling(false);
    }
  };

  const downloadPng = async () => {
    if (!pass) return;
    try {
      const res = await fetch(`${API_URL}/api/passes/${pass.id}/qr`, {
        headers: { Authorization: `Bearer ${tokenStore.getAccess()}` },
      });
      if (!res.ok) throw new Error(`Download failed (${res.status})`);
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `gatepass-${pass.id}.png`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      toast.error(getErrorMessage(e, "Could not download QR"));
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl glass">
        <DialogHeader>
          <DialogTitle>Pass details</DialogTitle>
          <DialogDescription>Full information and approval history</DialogDescription>
        </DialogHeader>
        {loading && <div className="py-10 text-center text-muted-foreground">Loading…</div>}
        {err && !loading && <ErrorState message={err} />}
        {pass && !loading && (
          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-3 text-sm">
              <Row label="Student" value={pass.studentName ?? "Unknown"} />
              <Row label="Student ID" value={String(pass.studentId ?? "N/A")} />
              {pass.studentEmail && <Row label="Email" value={pass.studentEmail} />}
              {pass.enrollmentNo && <Row label="Enrollment No" value={pass.enrollmentNo} />}
              {pass.roomNo && <Row label="Room No" value={pass.roomNo} />}
              <Row label="Reason" value={pass.reason ?? "N/A"} />
              <Row label="Destination" value={pass.destination ?? "N/A"} />
              <Row label="Type" value={pass.passType ?? "N/A"} />
              <Row label="Department" value={pass.department ?? "—"} />
              <Row label="Course" value={pass.course ?? "—"} />
              <Row label="Semester" value={pass.semester != null ? String(pass.semester) : "—"} />
              <Row label="Student mobile" value={pass.studentMobile ?? "—"} />
              <Row label="Parent mobile" value={pass.parentMobile ?? "—"} />
              {pass.qrToken && <Row label="Code" value={compressToken(pass.qrToken)} /> }
              {/* Full token shown next to QR below */}
              <Row label="Leave at" value={pass.leaveAt ? format(new Date(pass.leaveAt), "PPp") : "N/A"} />
              <Row label="Return by" value={pass.returnBy ? format(new Date(pass.returnBy), "PPp") : "N/A"} />
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Status</span>
                <StatusBadge status={pass.status} />
              </div>
              {pass.wardenId != null && <Row label="Decided by (ID)" value={String(pass.wardenId)} />}
              {pass.decisionNote && <Row label="Note" value={pass.decisionNote} />}
              {pass.status === "PENDING" && (
                <Button variant="destructive" disabled={cancelling} className="mt-2 w-full" onClick={cancel}>
                  {cancelling ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <X className="mr-2 h-4 w-4" />}
                  Cancel pass
                </Button>
              )}
            </div>
            <div className="space-y-4">
              {qr && (
                <div className="glass rounded-xl p-4 text-center">
                  <div className="mb-3 text-xs uppercase tracking-wider text-muted-foreground">
                    Gate QR
                  </div>
                  <img
                    src={qr}
                    alt="QR"
                    className="mx-auto h-44 w-44 rounded-md bg-white p-2"
                  />
                  {pass.qrToken && (
                    <div className="mt-3 text-left">
                      <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
                        Token
                      </div>
                      <div className="mt-1 break-all rounded-md border border-border bg-muted/40 p-2 font-mono text-[11px] leading-relaxed">
                        {pass.qrToken}
                      </div>
                    </div>
                  )}
                  <Button onClick={downloadPng} variant="secondary" className="mt-3 w-full">
                    <Download className="mr-2 h-4 w-4" /> Download PNG
                  </Button>
                </div>
              )}
              <div className="glass rounded-xl p-4">
                <div className="mb-3 flex items-center gap-2 text-xs uppercase tracking-wider text-muted-foreground">
                  <History className="h-3.5 w-3.5" /> Approval history
                </div>
                <ol className="relative space-y-3 border-l border-border pl-4">
                  {(history ?? []).length === 0 && (
                    <li className="text-xs text-muted-foreground">No history yet.</li>
                  )}
                  {(history ?? []).map((h) => (
                    <li key={h.id} className="relative">
                      <span className="absolute -left-[21px] top-1 h-2.5 w-2.5 rounded-full bg-primary" />
                      <div className="text-xs font-medium">
                        {h.fromStatus} → {h.toStatus}
                      </div>
                      <div className="text-[11px] text-muted-foreground">
                        {format(new Date(h.createdAt), "PPp")}
                      </div>
                      {h.note && (
                        <div className="mt-0.5 text-xs text-muted-foreground">
                          “{h.note}”
                        </div>
                      )}
                    </li>
                  ))}
                </ol>
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-4">
      <span className="text-muted-foreground">{label}</span>
      <span className="text-right font-medium">{value}</span>
    </div>
  );
}
