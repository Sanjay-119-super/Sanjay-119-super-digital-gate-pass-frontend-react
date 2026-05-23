import { Link, useRouterState, useNavigate } from "@tanstack/react-router";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarFooter,
  useSidebar,
} from "@/components/ui/sidebar";
import {
  LayoutDashboard,
  FilePlus2,
  ClipboardList,
  ShieldCheck,
  ScanLine,
  Download,
  LogOut,
  KeyRound,
} from "lucide-react";
import { useAuth, defaultRouteForUser } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import type { Role } from "@/lib/types";
import logo from "@/assets/logo.jpg";

interface NavItem {
  title: string;
  to: string;
  icon: React.ComponentType<{ className?: string }>;
  roles: Role[];
}

const navItems: NavItem[] = [
  { title: "Dashboard", to: "/admin", icon: LayoutDashboard, roles: ["ADMIN"] },
  { title: "My Passes", to: "/student", icon: ClipboardList, roles: ["STUDENT"] },
  { title: "New Pass", to: "/student/new", icon: FilePlus2, roles: ["STUDENT"] },
  { title: "Pending Requests", to: "/warden", icon: ShieldCheck, roles: ["WARDEN", "ADMIN"] },
  { title: "Scan", to: "/security", icon: ScanLine, roles: ["SECURITY", "ADMIN"] },
  { title: "Verify", to: "/verify", icon: KeyRound, roles: ["SECURITY", "ADMIN", "WARDEN"] },
  { title: "Exports", to: "/admin/export", icon: Download, roles: ["ADMIN", "WARDEN"] },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const path = useRouterState({ select: (s) => s.location.pathname });
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const userRoles = user?.roles ?? [];
  const items = navItems.filter((i) => userRoles.some((r) => i.roles.includes(r)));

  const handleLogout = async () => {
    await logout();
    navigate({ to: "/auth", replace: true });
  };

  return (
    <Sidebar collapsible="icon" className="border-r border-sidebar-border">
      <SidebarHeader className="px-3 py-4">
        <Link
          to={user ? defaultRouteForUser(user) : "/"}
          className="flex items-center gap-2"
        >
          <img
            src={logo}
            alt="Digital GatePass"
            className="h-9 w-auto rounded-md object-contain"
            style={{ maxWidth: collapsed ? "36px" : "160px" }}
          />
        </Link>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Workspace</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => {
                const active = path === item.to || path.startsWith(item.to + "/");
                return (
                  <SidebarMenuItem key={item.to}>
                    <SidebarMenuButton asChild isActive={active}>
                      <Link to={item.to} className="flex items-center gap-2">
                        <item.icon className="h-4 w-4" />
                        {!collapsed && <span>{item.title}</span>}
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter className="p-2">
        <Button
          variant="ghost"
          onClick={handleLogout}
          className="w-full justify-start gap-2 text-muted-foreground hover:text-foreground"
        >
          <LogOut className="h-4 w-4" />
          {!collapsed && <span>Sign out</span>}
        </Button>
      </SidebarFooter>
    </Sidebar>
  );
}
