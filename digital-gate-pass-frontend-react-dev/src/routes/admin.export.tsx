import { createFileRoute } from "@tanstack/react-router";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { DashboardShell } from "@/components/DashboardShell";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileText, FileSpreadsheet, Loader2 } from "lucide-react";
import { useState } from "react";
import { API_URL, tokenStore } from "@/lib/api";
import toast from "react-hot-toast";

export const Route = createFileRoute("/admin/export")({
  component: () => (
    <ProtectedRoute roles={["ADMIN", "WARDEN"]}>
      <ExportPage />
    </ProtectedRoute>
  ),
});

function ExportPage() {
  const [busy, setBusy] = useState<string | null>(null);

  const download = async (kind: "csv" | "pdf") => {
    setBusy(kind);
    try {
      const res = await fetch(`${API_URL}/api/export/${kind}`, {
        headers: { Authorization: `Bearer ${tokenStore.getAccess()}` },
      });
      if (!res.ok) throw new Error(`Export failed (${res.status})`);
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `passes-export.${kind}`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success("Download started");
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setBusy(null);
    }
  };

  return (
    <DashboardShell title="Exports" subtitle="Download pass data for reporting">
      <div className="grid gap-4 md:grid-cols-2 max-w-3xl">
        <ExportCard
          icon={FileSpreadsheet}
          title="CSV export"
          desc="All passes in spreadsheet form"
          onClick={() => download("csv")}
          busy={busy === "csv"}
        />
        <ExportCard
          icon={FileText}
          title="PDF export"
          desc="Printable PDF report"
          onClick={() => download("pdf")}
          busy={busy === "pdf"}
        />
      </div>
    </DashboardShell>
  );
}

function ExportCard({
  icon: Icon,
  title,
  desc,
  onClick,
  busy,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  desc: string;
  onClick: () => void;
  busy: boolean;
}) {
  return (
    <Card className="glass border-border/60">
      <CardContent className="p-6">
        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/15 text-primary">
          <Icon className="h-5 w-5" />
        </div>
        <h3 className="mt-4 text-base font-semibold">{title}</h3>
        <p className="text-sm text-muted-foreground">{desc}</p>
        <Button onClick={onClick} disabled={busy} className="mt-4 w-full">
          {busy && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Download
        </Button>
      </CardContent>
    </Card>
  );
}
