import { Sidebar } from "@/components/sidebar";
import { TopBar } from "@/components/top-bar";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar />
      <div className="lg:pl-64 flex flex-col min-h-screen">
        <TopBar />
        <main className="flex-1 p-6" id="main-content">
          {children}
        </main>
      </div>
    </div>
  );
}
