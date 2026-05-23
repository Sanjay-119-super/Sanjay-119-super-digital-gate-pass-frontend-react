import { useAuth } from "@/lib/auth";
import { SidebarTrigger } from "@/components/ui/sidebar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useNavigate, useRouterState } from "@tanstack/react-router";
import { LogOut } from "lucide-react";
import { displayName } from "@/lib/display";
import { Badge } from "@/components/ui/badge";
import type { Role } from "@/lib/types";
import { ThemeToggle } from "./ThemeToggle";

function activeRoleFromPath(path: string, roles: Role[]): Role | null {
  const map: Array<[string, Role]> = [
    ["/admin", "ADMIN"],
    ["/warden", "WARDEN"],
    ["/security", "SECURITY"],
    ["/verify", "SECURITY"],
    ["/student", "STUDENT"],
  ];
  for (const [prefix, role] of map) {
    if (path === prefix || path.startsWith(prefix + "/")) {
      if (roles.includes(role)) return role;
      // fall through to first available role if user doesn't actually have it
      return roles[0] ?? null;
    }
  }
  return roles[0] ?? null;
}

export function TopBar({ title, subtitle }: { title: string; subtitle?: string }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const name = displayName(user, "User");
  const roles = user?.roles ?? [];
  const path = useRouterState({ select: (s) => s.location.pathname });
  const activeRole = activeRoleFromPath(path, roles);

  const initials = name
    ?.split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between gap-3 border-b border-border bg-background/60 px-4 backdrop-blur-xl md:px-6">
      <div className="flex items-center gap-3 min-w-0">
        <SidebarTrigger />
        <div className="min-w-0">
          <h1 className="truncate text-base font-semibold md:text-lg">{title}</h1>
          {subtitle && (
            <p className="truncate text-xs text-muted-foreground">{subtitle}</p>
          )}
        </div>
      </div>
      <div className="flex items-center gap-2">
        <ThemeToggle />
      <DropdownMenu>
        <DropdownMenuTrigger className="flex items-center gap-2 rounded-full border border-border bg-card/50 py-1 pl-1 pr-3 text-left transition hover:bg-card">
          <Avatar className="h-7 w-7">
            <AvatarFallback className="bg-primary text-primary-foreground text-xs">
              {initials || "U"}
            </AvatarFallback>
          </Avatar>
          <div className="hidden sm:block leading-tight">
            <div className="text-xs font-medium">{name}</div>
            <div className="mt-0.5 flex flex-wrap gap-1">
              {activeRole ? (
                <Badge variant="outline" className="px-1.5 py-0 text-[9px] leading-tight">
                  {activeRole}
                </Badge>
              ) : (
                <span className="text-[10px] text-muted-foreground">No role</span>
              )}
            </div>
          </div>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuLabel className="truncate">{user?.email}</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={async () => {
              await logout();
              navigate({ to: "/auth", replace: true });
            }}
            className="gap-2"
          >
            <LogOut className="h-4 w-4" /> Sign out
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      </div>
    </header>
  );
}
