import { useEffect, type ReactNode } from "react";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { AppSidebar } from "./AppSidebar";
import { TopBar } from "./TopBar";

export function DashboardShell({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: ReactNode;
}) {
  useEffect(() => {
    document.title = `${title} • GatePass`;
  }, [title]);
  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full">
        <AppSidebar />
        <SidebarInset className="flex flex-1 flex-col bg-transparent">
          <TopBar title={title} subtitle={subtitle} />
          <main className="flex-1 px-4 py-6 md:px-8 md:py-8">{children}</main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}
