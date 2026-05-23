import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { DashboardShell } from "@/components/DashboardShell";
import { useState } from "react";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import type { GatePass, PassType } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import toast from "react-hot-toast";
import { Loader2 } from "lucide-react";
import { getErrorMessage } from "@/components/AsyncState";

const PHONE_RE = /^\d{10}$/;
const DEPARTMENTS = [
  "Computer Science",
  "Electronics",
  "Mechanical",
  "Civil",
  "Agriculture",
  "Pharmacy",
  "Diploma",
  "Law",
  "BBA",
  "MBA",
  "BMYS",
  "B.Com",
  "B.Sc",
  "B.Ed",
];

export const Route = createFileRoute("/student/new")({
  component: () => (
    <ProtectedRoute roles={["STUDENT"]}>
      <NewPass />
    </ProtectedRoute>
  ),
});

function NewPass() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [reason, setReason] = useState("");
  const [destination, setDestination] = useState("");
  const [passType, setPassType] = useState<PassType>("DAY");
  const [leaveAt, setLeaveAt] = useState("");
  const [returnBy, setReturnBy] = useState("");
  const [department, setDepartment] = useState(user?.department ?? "");
  const [course, setCourse] = useState(user?.course ?? "");
  const [semester, setSemester] = useState<number>(user?.semester ?? 1);
  const [studentMobile, setStudentMobile] = useState(
    user?.studentMobile ?? user?.phone ?? "",
  );
  const [parentMobile, setParentMobile] = useState(user?.parentMobile ?? "");
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (busy) return;
    if (reason.trim().length === 0) {
      toast.error("Please describe your reason");
      return;
    }
    if (reason.length > 500) {
      toast.error("Reason must be 500 characters or less");
      return;
    }
    const leaveDate = new Date(leaveAt);
    const returnDate = new Date(returnBy);
    if (isNaN(leaveDate.getTime()) || leaveDate.getTime() <= Date.now() + 5 * 60 * 1000) {
      toast.error("Leave time must be at least 5 minutes from now");
      return;
    }
    if (isNaN(returnDate.getTime()) || returnDate <= leaveDate) {
      toast.error("Return time must be after leave time");
      return;
    }
    if (!department || !course.trim()) {
      toast.error("Department and course are required");
      return;
    }
    if (semester < 1 || semester > 8) {
      toast.error("Semester must be between 1 and 8");
      return;
    }
    if (!PHONE_RE.test(studentMobile) || !PHONE_RE.test(parentMobile)) {
      toast.error("Mobile numbers must be exactly 10 digits");
      return;
    }
    if (studentMobile === parentMobile) {
      toast.error("Student aur Parent mobile number alag-alag hone chahiye");
      return;
    }
    setBusy(true);
    try {
      const created = await api<GatePass>("/api/passes", {
        method: "POST",
        body: {
          reason,
          destination,
          passType,
          leaveAt: leaveDate.toISOString(),
          returnBy: returnDate.toISOString(),
          department,
          course,
          semester,
          studentMobile,
          parentMobile,
        },
      });
      toast.success("Pass requested");
      navigate({ to: "/student" });
      void created;
    } catch (e) {
      toast.error(getErrorMessage(e, "Failed to submit request"));
    } finally {
      setBusy(false);
    }
  };

  return (
    <DashboardShell title="New Pass" subtitle="Submit a new gate-pass request">
      <Card className="glass mx-auto max-w-2xl border-border/60">
        <CardContent className="p-6 md:p-8">
          <form onSubmit={submit} className="space-y-5">
            <div>
              <Label className="text-xs text-muted-foreground">Reason</Label>
              <Textarea
                required
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Why do you need to leave campus?"
                className="mt-1.5"
                rows={3}
              />
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <Label className="text-xs text-muted-foreground">Destination</Label>
                <Input
                  required
                  className="mt-1.5"
                  value={destination}
                  onChange={(e) => setDestination(e.target.value)}
                />
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Pass type</Label>
                <Select value={passType} onValueChange={(v) => setPassType(v as PassType)}>
                  <SelectTrigger className="mt-1.5">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="DAY">Day</SelectItem>
                    <SelectItem value="NIGHT">Night</SelectItem>
                    <SelectItem value="EMERGENCY">Emergency</SelectItem>
                    <SelectItem value="MEDICAL">Medical</SelectItem>
                    <SelectItem value="HOME">Home</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Leave at</Label>
                <Input
                  required
                  type="datetime-local"
                  className="mt-1.5"
                  value={leaveAt}
                  onChange={(e) => setLeaveAt(e.target.value)}
                />
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Return by</Label>
                <Input
                  required
                  type="datetime-local"
                  className="mt-1.5"
                  value={returnBy}
                  onChange={(e) => setReturnBy(e.target.value)}
                />
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <Label className="text-xs text-muted-foreground">Department *</Label>
                <Select value={department} onValueChange={setDepartment}>
                  <SelectTrigger className="mt-1.5">
                    <SelectValue placeholder="Select department" />
                  </SelectTrigger>
                  <SelectContent>
                    {DEPARTMENTS.map((d) => (
                      <SelectItem key={d} value={d}>
                        {d}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Course *</Label>
                <Input
                  required
                  className="mt-1.5"
                  placeholder="e.g. B.Tech"
                  value={course}
                  onChange={(e) => setCourse(e.target.value)}
                />
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Semester * (1-8)</Label>
                <Input
                  required
                  type="number"
                  min={1}
                  max={8}
                  className="mt-1.5"
                  value={semester}
                  onChange={(e) => setSemester(Number(e.target.value) || 1)}
                />
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Student mobile *</Label>
                <Input
                  required
                  type="tel"
                  inputMode="numeric"
                  pattern="\d{10}"
                  maxLength={10}
                  placeholder="10 digits"
                  className="mt-1.5"
                  value={studentMobile}
                  onChange={(e) =>
                    setStudentMobile(e.target.value.replace(/\D/g, "").slice(0, 10))
                  }
                />
              </div>
              <div className="md:col-span-2">
                <Label className="text-xs text-muted-foreground">Parent mobile *</Label>
                <Input
                  required
                  type="tel"
                  inputMode="numeric"
                  pattern="\d{10}"
                  maxLength={10}
                  placeholder="10 digits"
                  className="mt-1.5"
                  value={parentMobile}
                  onChange={(e) =>
                    setParentMobile(e.target.value.replace(/\D/g, "").slice(0, 10))
                  }
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate({ to: "/student" })}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={busy}>
                {busy && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Submit request
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </DashboardShell>
  );
}
