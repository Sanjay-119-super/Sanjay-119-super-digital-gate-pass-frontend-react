// index.tsx src ke under root route hai, jiska matlab hai ki ye component app ke har page par render hoga. Isme hum global providers jaise ki AuthProvider, QueryClientProvider, aur Toaster ko wrap karte hain, taaki ye sabhi pages par available ho. Iske alawa, hum ek NotFoundComponent bhi define karte hain jo 404 errors ke liye dikhaya jayega, aur ek ErrorComponent jo kisi bhi unexpected error ke liye dikhaya jayega.
import { createFileRoute, Link, Navigate } from "@tanstack/react-router";
import { useAuth, defaultRouteForUser } from "@/lib/auth";
import { ShieldCheck, ScanLine, Users, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import logo from "@/assets/logo.jpg";

export const Route = createFileRoute("/")({
  component: Index,
});

function Index() {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (user) return <Navigate to={defaultRouteForUser(user)} replace />;

  return (
    <div className="min-h-screen">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-6 py-6">
        <div className="flex items-center gap-2">
          <img
            src={logo}
            alt="Digital GatePass"
            className="h-10 w-auto rounded-md object-contain"
            style={{ maxWidth: "220px" }}
          />
        </div>
        <div className="flex gap-2">
          <Button asChild variant="ghost">
            <Link to="/auth" search={{ tab: "login" }}>Sign in</Link>
          </Button>
          <Button asChild>
            <Link to="/auth" search={{ tab: "register" }}>
              Get started
            </Link>
          </Button>
        </div>
      </header>

      <section className="mx-auto max-w-6xl px-6 pt-10 pb-16 md:pt-20 md:pb-24">
        <div className="grid gap-12 md:grid-cols-2 md:items-center">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full border border-border bg-card/50 px-3 py-1 text-xs text-muted-foreground">
              <span className="h-1.5 w-1.5 rounded-full bg-success" />
              Live campus gate-pass platform
            </span>
            <h1 className="mt-5 text-4xl font-bold leading-tight tracking-tight md:text-6xl">
              Move students through the gate{" "}
              <span className="bg-gradient-to-r from-primary to-sky-300 bg-clip-text text-transparent">
                effortlessly.
              </span>
            </h1>
            <p className="mt-5 max-w-lg text-base text-muted-foreground md:text-lg">
              A unified workspace for students, wardens, security and admins —
              request, approve, and verify gate passes with QR-secured trust.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button asChild size="lg">
                <Link to="/auth" search={{ tab: "register" }}>
                  Create account <ArrowRight className="ml-1 h-4 w-4" />
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg">
                <Link to="/auth" search={{ tab: "login" }}>Sign in</Link>
              </Button>
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Feature icon={Users} title="For Students" desc="Request and track passes in seconds." />
            <Feature icon={ShieldCheck} title="For Wardens" desc="Approve with one click + audit trail." />
            <Feature icon={ScanLine} title="For Security" desc="Scan QR to check-out and check-in." />
            <Feature icon={ShieldCheck} title="For Admins" desc="Live stats, exports, and oversight." />
          </div>
        </div>
      </section>
    </div>
  );
}

function Feature({
  icon: Icon,
  title,
  desc,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  desc: string;
}) {
  return (
    <div className="glass rounded-xl p-5">
      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/15 text-primary">
        <Icon className="h-5 w-5" />
      </div>
      <div className="mt-3 text-sm font-semibold">{title}</div>
      <div className="text-xs text-muted-foreground">{desc}</div>
    </div>
  );
}
