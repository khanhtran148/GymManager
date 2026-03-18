import { Sidebar } from "@/components/sidebar";
import { TopBar } from "@/components/top-bar";
import { PermissionSyncProvider } from "@/components/permission-sync-provider";
import { RbacProvider } from "@/components/rbac-provider";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <RbacProvider>
      <div className="min-h-screen bg-page">
        <Sidebar />
        <div className="lg:pl-64 flex flex-col min-h-screen">
          <TopBar />
          <main className="flex-1 p-6" id="main-content">
            <PermissionSyncProvider>{children}</PermissionSyncProvider>
          </main>
        </div>
      </div>
    </RbacProvider>
  );
}
