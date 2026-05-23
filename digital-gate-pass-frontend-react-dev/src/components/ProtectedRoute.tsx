// ─────────────────────────────────────────────────────────────────────────────
// src/components/ProtectedRoute.tsx
//
// FIXED BUGS:
//  1. loading check missing tha — auth state settle hone se pehle hi redirect
//     ho jaata tha, chahe user actually logged in ho.
//
//  2. Role mismatch pe user ko unke sahi dashboard pe bhejna — e.g. agar
//     WARDEN /student kholne ki koshish kare toh /warden/ pe redirect.
//     Pehle koi bhi non-matching role /auth pe jaata tha, jo wrong tha.
// ─────────────────────────────────────────────────────────────────────────────

import { Navigate } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { useAuth, defaultRouteForUser } from "@/lib/auth";

interface ProtectedRouteProps {
  /** Allowed roles. If omitted, any authenticated user can access. */
  roles?: string[];
  children: ReactNode;
}

export function ProtectedRoute({ roles, children }: ProtectedRouteProps) {
  const { user, loading } = useAuth();

  // ✅ FIX 1: Jab tak auth state initialize ho raha hai, kuch bhi render mat karo.
  // Pehle yeh check nahi tha — user null hota tha (still loading) → redirect to /auth
  // → auth page load → loading complete → user set → redirect to /student → loop.
  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  // Not logged in → send to auth page
  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  // ✅ FIX 2: Role check — agar role match nahi toh user ke correct dashboard pe bhejo
  // (WARDEN ko /auth pe mat bhejo, /warden/ pe bhejo)
  if (roles && roles.length > 0) {
    const userRoles = user.roles?.length ? user.roles : [user.role];
    const hasAccess = roles.some((r) => userRoles.includes(r));

    if (!hasAccess) {
      // User logged in hai but wrong page pe hai — sahi jagah bhejo
      return <Navigate to={defaultRouteForUser(user)} replace />;
    }
  }

  return <>{children}</>;
}