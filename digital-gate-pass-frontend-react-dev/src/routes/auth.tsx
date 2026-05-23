import { createFileRoute, useNavigate, Navigate } from "@tanstack/react-router";
import { useAuth, defaultRouteForUser } from "@/lib/auth";
import type { RegisterPayload } from "@/lib/auth";
import type { Role } from "@/lib/types";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import toast from "react-hot-toast";
import { Loader2 } from "lucide-react";
import logo from "@/assets/logo.jpg";

export const Route = createFileRoute("/auth")({
  validateSearch: (s: Record<string, unknown>) => ({
    tab: s.tab === "register" ? "register" : "login",
  }),
  component: AuthPage,
});

const PHONE_RE = /^\d{10}$/;

function AuthPage() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const search = Route.useSearch();
  const [tab, setTab] = useState<string>(search.tab ?? "login");

  if (!loading && user) return <Navigate to={defaultRouteForUser(user)} replace />;

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-12">
      <div className="w-full max-w-md space-y-6">
        <div className="flex justify-center">
          <img
            src={logo}
            alt="GatePass"
            className="h-12 w-auto rounded-md object-contain"
          />
        </div>
        <Tabs value={tab} onValueChange={setTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="login">Sign In</TabsTrigger>
            <TabsTrigger value="register">Register</TabsTrigger>
          </TabsList>

          <TabsContent value="login">
            <LoginForm
              onSuccess={(u) => navigate({ to: defaultRouteForUser(u) })}
              onForgot={() => setTab("forgot")}
            />
          </TabsContent>

          <TabsContent value="register">
            <RegisterForm onDone={() => setTab("verify")} />
          </TabsContent>

          <TabsContent value="verify">
            <VerifyForm onSuccess={() => setTab("login")} />
          </TabsContent>

          <TabsContent value="forgot">
            <ForgotForm onBack={() => setTab("login")} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

// ── Login ─────────────────────────────────────────────────────────────────────
function LoginForm({
  onSuccess,
  onForgot,
}: {
  onSuccess: (u: any) => void;
  onForgot: () => void;
}) {
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    try {
      const u = await login(email, password);
      toast.success("Welcome back!");
      onSuccess(u);
    } catch (e: any) {
      toast.error(e?.message ?? "Login failed. Check credentials.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Card className="glass border-border/60">
      <CardHeader>
        <CardTitle className="text-center text-lg">Sign in to GatePass</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={submit} className="space-y-4">
          <Field
            label="Email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <Field
            label="Password"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <Button type="submit" className="w-full" disabled={busy}>
            {busy && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Sign In
          </Button>
          <button
            type="button"
            onClick={onForgot}
            className="w-full text-center text-xs text-muted-foreground hover:text-foreground"
          >
            Forgot password?
          </button>
        </form>
      </CardContent>
    </Card>
  );
}

// ── Register ──────────────────────────────────────────────────────────────────
function RegisterForm({ onDone }: { onDone: () => void }) {
  const { register } = useAuth();
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState({
    email: "",
    password: "",
    fullName: "",
    enrollmentNo: "",
    hostel: "",
    roomNo: "",
    department: "",
    course: "",
    semester: 1,
    studentMobile: "",
    parentMobile: "",
  });

  const setField =
    (k: keyof typeof form) =>
    (e: React.ChangeEvent<HTMLInputElement>) =>
      setForm((f) => ({
        ...f,
        [k]: k === "semester" ? Number(e.target.value) || 1 : e.target.value,
      }));

  const mobileError =
    form.studentMobile.length === 10 &&
    form.parentMobile.length === 10 &&
    form.studentMobile === form.parentMobile;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (busy) return;

    if (!PHONE_RE.test(form.studentMobile)) {
      toast.error("Student mobile must exactly 10 digits");
      return;
    }
    if (!PHONE_RE.test(form.parentMobile)) {
      toast.error("Parent mobile must exactly 10 digits");
      return;
    }
    if (form.studentMobile === form.parentMobile) {
      toast.error("Student and Parent mobile numbers must be different");
      return;
    }
    if (form.semester < 1 || form.semester > 8) {
      toast.error("Semester must be between 1 and 8");
      return;
    }

    setBusy(true);
    try {
      const payload: RegisterPayload = {
        ...form,
        phone: form.studentMobile,
        roles: ["STUDENT" as Role],
      };
      const res = await register(payload);
      toast.success(
        res?.message ?? "Registration successful! Check your email for the OTP."
      );
      onDone();
    } catch (e: any) {
      toast.error(e?.message ?? "Registration failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Card className="glass border-border/60">
      <CardHeader>
        <CardTitle className="text-center text-lg">Create Student Account</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={submit} className="space-y-3">
          <Field
            label="Full Name *"
            value={form.fullName}
            onChange={setField("fullName")}
            required
          />
          <Field
            label="Email *"
            type="email"
            value={form.email}
            onChange={setField("email")}
            required
          />
          <Field
            label="Password * (min 6 characters)"
            type="password"
            value={form.password}
            onChange={setField("password")}
            required
            minLength={6}
          />
          <Field
            label="Enrollment No"
            value={form.enrollmentNo}
            onChange={setField("enrollmentNo")}
          />
          <div className="grid grid-cols-2 gap-3">
            <Field label="Hostel" value={form.hostel} onChange={setField("hostel")} />
            <Field label="Room No" value={form.roomNo} onChange={setField("roomNo")} />
          </div>
          <Field
            label="Department *"
            value={form.department}
            onChange={setField("department")}
            required
          />
          <div className="grid grid-cols-2 gap-3">
            <Field
              label="Course *"
              value={form.course}
              onChange={setField("course")}
              required
            />
            <Field
              label="Semester * (1–8)"
              type="number"
              min={1}
              max={8}
              value={String(form.semester)}
              onChange={setField("semester")}
              required
            />
          </div>

          {/* Student Mobile */}
          <div>
            <Label className="text-xs text-muted-foreground">
              Student Mobile 
            </Label>
            <Input
              required
              type="tel"
              inputMode="numeric"
              maxLength={10}
              pattern="\d{10}"
              placeholder="10 digit student mobile"
              className="mt-1.5"
              value={form.studentMobile}
              onChange={(e) =>
                setForm((f) => ({
                  ...f,
                  studentMobile: e.target.value.replace(/\D/g, "").slice(0, 10),
                }))
              }
            />
          </div>

          {/* Parent Mobile */}
          <div>
            <Label className="text-xs text-muted-foreground">
              Parent / Guardian Mobile 
            </Label>
            <Input
              required
              type="tel"
              inputMode="numeric"
              maxLength={10}
              pattern="\d{10}"
              placeholder="10 digit parent mobile"
              className={`mt-1.5 ${mobileError ? "border-destructive focus-visible:ring-destructive" : ""}`}
              value={form.parentMobile}
              onChange={(e) =>
                setForm((f) => ({
                  ...f,
                  parentMobile: e.target.value.replace(/\D/g, "").slice(0, 10),
                }))
              }
            />
            {mobileError && (
              <p className="mt-1 text-xs text-destructive">
                ⚠ Student and Parent mobile numbers must be different
              </p>
            )}
          </div>

          <Button type="submit" className="w-full" disabled={busy}>
            {busy && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Register
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

// ── Verify Email ──────────────────────────────────────────────────────────────
function VerifyForm({ onSuccess }: { onSuccess: () => void }) {
  const { verifyEmail } = useAuth();
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    try {
      await verifyEmail(email, otp);
      toast.success("Email verified! You can now sign in.");
      onSuccess();
    } catch (e: any) {
      toast.error(e?.message ?? "Verification failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Card className="glass border-border/60">
      <CardHeader>
        <CardTitle className="text-center text-lg">Verify Your Email</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="mb-4 text-center text-xs text-muted-foreground">
          Enter the OTP sent to your email.
        </p>
        <form onSubmit={submit} className="space-y-4">
          <Field
            label="Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <Field
            label="OTP (email se)"
            value={otp}
            onChange={(e) => setOtp(e.target.value)}
            required
            maxLength={6}
          />
          <Button type="submit" className="w-full" disabled={busy}>
            {busy && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Verify Email
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

// ── Forgot Password ───────────────────────────────────────────────────────────
function ForgotForm({ onBack }: { onBack: () => void }) {
  const { forgotPassword } = useAuth();
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    try {
      await forgotPassword(email);
      setSent(true);
      toast.success("Reset link sent to your email!");
    } catch (e: any) {
      toast.error(e?.message ?? "Failed to send reset email");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Card className="glass border-border/60">
      <CardHeader>
        <CardTitle className="text-center text-lg">Reset Password</CardTitle>
      </CardHeader>
      <CardContent>
        {sent ? (
          <div className="space-y-4 text-center">
            <p className="text-sm text-muted-foreground">
              Password reset link sent to your email. Check your inbox.
            </p>
            <Button variant="outline" className="w-full" onClick={onBack}>
              Back to Sign In
            </Button>
          </div>
        ) : (
          <form onSubmit={submit} className="space-y-4">
            <Field
              label="Registered Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <Button type="submit" className="w-full" disabled={busy}>
              {busy && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Send Reset Link
            </Button>
            <button
              type="button"
              onClick={onBack}
              className="w-full text-center text-xs text-muted-foreground hover:text-foreground"
            >
              Back to Sign In
            </button>
          </form>
        )}
      </CardContent>
    </Card>
  );
}

// ── Shared Field ──────────────────────────────────────────────────────────────
function Field({
  label,
  ...props
}: { label: string } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div>
      <Label className="text-xs text-muted-foreground">{label}</Label>
      <Input className="mt-1.5" {...props} />
    </div>
  );
}
