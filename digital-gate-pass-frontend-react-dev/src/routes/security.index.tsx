import { createFileRoute } from "@tanstack/react-router";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { DashboardShell } from "@/components/DashboardShell";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { api } from "@/lib/api";
import type { GatePass } from "@/lib/types";
import { ScanLine, Loader2, Camera, CameraOff } from "lucide-react";
import toast from "react-hot-toast";
import { StatusBadge } from "@/components/StatusBadge";
import { format } from "date-fns";
import { getErrorMessage } from "@/components/AsyncState";
import { Html5Qrcode } from "html5-qrcode";

export const Route = createFileRoute("/security/")({
  component: () => (
    <ProtectedRoute roles={["SECURITY", "ADMIN"]}>
      <SecurityScan />
    </ProtectedRoute>
  ),
});

function SecurityScan() {
  const [token, setToken] = useState("");
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<GatePass | null>(null);
  const [cameraOn, setCameraOn] = useState(false);
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const lastScannedRef = useRef<string>("");
  const containerId = "qr-camera-region";

  const performScan = async (qrToken: string) => {
    const trimmed = qrToken.trim();
    if (!trimmed || busy) return;
    setBusy(true);
    setResult(null);
    try {
      const r = await api<GatePass>("/api/verify/scan", {
        method: "POST",
        body: { qrToken: trimmed },
      });
      setResult(r);
      toast.success(`Pass marked ${r?.status ?? "verified"}`);
    } catch (e) {
      toast.error(getErrorMessage(e, "Scan failed — pass not found or already used"));
    } finally {
      setBusy(false);
    }
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    void performScan(token);
  };

  const stopCamera = async () => {
    const s = scannerRef.current;
    scannerRef.current = null;
    setCameraOn(false);
    lastScannedRef.current = "";
    if (s) {
      try {
        if (s.isScanning) await s.stop();
      } catch {
        // ignore
      }
      try {
        await s.clear();
      } catch {
        // ignore
      }
    }
  };

  const startCamera = async () => {
    if (cameraOn || scannerRef.current) {
      await stopCamera();
      return;
    }
    // Browser support check
    if (!navigator.mediaDevices || typeof navigator.mediaDevices.getUserMedia !== "function") {
      toast.error("Camera not supported in this browser");
      return;
    }
    // Pre-request permission so we can show a clear error
    try {
      const probe = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
      probe.getTracks().forEach((t) => t.stop());
    } catch (e) {
      const name = (e as DOMException)?.name;
      if (name === "NotAllowedError" || name === "PermissionDeniedError") {
        toast.error("Camera permission denied. Enable it in your browser settings.");
      } else if (name === "NotFoundError" || name === "DevicesNotFoundError") {
        toast.error("No camera found on this device.");
      } else {
        toast.error(getErrorMessage(e, "Could not access camera"));
      }
      return;
    }
    setCameraOn(true);
    // Wait for the container to mount in the DOM
    await new Promise((r) => setTimeout(r, 80));
    const el = document.getElementById(containerId);
    if (!el) {
      toast.error("Scanner failed to initialise");
      setCameraOn(false);
      return;
    }
    try {
      const scanner = new Html5Qrcode(containerId, { verbose: false });
      scannerRef.current = scanner;
      await scanner.start(
        { facingMode: "environment" },
        { fps: 10, qrbox: { width: 240, height: 240 } },
        async (decoded) => {
          // Debounce repeat reads of the same code
          if (decoded === lastScannedRef.current) return;
          lastScannedRef.current = decoded;
          setToken(decoded);
          await stopCamera();
          await performScan(decoded);
        },
        () => {
          // ignore per-frame decode errors
        },
      );
    } catch (e) {
      toast.error(getErrorMessage(e, "Could not start camera scanner"));
      await stopCamera();
    }
  };

  useEffect(() => {
    return () => {
      void stopCamera();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <DashboardShell title="Security Dashboard" subtitle="Scan QR codes to check students out and back in">
      <div className="mx-auto max-w-2xl space-y-6">
        <Card className="glass border-border/60">
          <CardContent className="p-6">
            <form onSubmit={submit} className="space-y-4">
              <label className="flex items-center gap-2 text-sm text-muted-foreground">
                <ScanLine className="h-4 w-4" /> Paste or enter QR token
              </label>
              <Input
                value={token}
                onChange={(e) => setToken(e.target.value)}
                placeholder="QR token..."
                className="h-12 text-base"
              />
              <div className="flex flex-col gap-2 sm:flex-row">
                <Button type="submit" className="flex-1" disabled={busy}>
                  {busy && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Scan token
                </Button>
                <Button type="button" variant="outline" onClick={startCamera}>
                  {cameraOn ? (
                    <>
                      <CameraOff className="mr-2 h-4 w-4" /> Stop camera
                    </>
                  ) : (
                    <>
                      <Camera className="mr-2 h-4 w-4" /> Use camera
                    </>
                  )}
                </Button>
              </div>
              <div
                id={containerId}
                className={
                  cameraOn
                    ? "mt-2 overflow-hidden rounded-lg border border-border bg-black"
                    : "hidden"
                }
              />
            </form>
          </CardContent>
        </Card>

        {result?.status === "RETURNED" && (
          <div className="glass rounded-xl border border-emerald-500/40 bg-emerald-500/10 p-4 text-center">
            <div className="text-3xl">✅</div>
            <div className="mt-1 text-base font-semibold text-emerald-500">
              Student has returned to campus
            </div>
            <div className="text-xs text-muted-foreground">
              Entry recorded at{" "}
              {result.returnedAt ? format(new Date(result.returnedAt), "PPp") : "just now"}
            </div>
          </div>
        )}
        {result?.status === "USED" && (
          <div className="glass rounded-xl border border-warning/40 bg-warning/10 p-4 text-center">
            <div className="text-3xl">🚶</div>
            <div className="mt-1 text-base font-semibold text-warning">
              Student has left campus
            </div>
            <div className="text-xs text-muted-foreground">
              Exit recorded at{" "}
              {result.usedAt ? format(new Date(result.usedAt), "PPp") : "just now"}
            </div>
          </div>
        )}

        {result && (
          <Card className="glass border-border/60">
            <CardContent className="p-6">
              <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
                <div>
                  <div className="text-xs text-muted-foreground">Result</div>
                  <div className="text-lg font-semibold">{result.studentName ?? "Unknown"}</div>
                  <div className="text-xs text-muted-foreground">ID #{result.studentId ?? "N/A"}</div>
                </div>
                <StatusBadge status={result.status} />
              </div>
              <dl className="grid gap-2 text-sm">
                <Row label="Reason" value={result.reason ?? "N/A"} />
                <Row label="Destination" value={result.destination ?? "N/A"} />
                <Row label="Student Mobile" value={result.studentMobile ?? "—"} />
                <Row label="Parent Mobile" value={result.parentMobile ?? "—"} />
                <Row label="Leave" value={result.leaveAt ? format(new Date(result.leaveAt), "PPp") : "N/A"} />
                <Row label="Return by" value={result.returnBy ? format(new Date(result.returnBy), "PPp") : "N/A"} />
                {result.usedAt && (
                  <Row label="Used at" value={format(new Date(result.usedAt), "PPp")} />
                )}
                {result.returnedAt && (
                  <Row label="Returned" value={format(new Date(result.returnedAt), "PPp")} />
                )}
              </dl>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardShell>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-border/40 py-1.5 last:border-0">
      <span className="text-muted-foreground">{label}</span>
      <span className="text-right font-medium">{value}</span>
    </div>
  );
}
