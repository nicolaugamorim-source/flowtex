import { SidebarWrapper } from "@/components/app/sidebar-wrapper";
import { AppGuard } from "@/components/app/app-guard";

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AppGuard>
      <div className="flex h-screen bg-[#F8FAFC]">
        <SidebarWrapper />
        <main className="flex-1 ml-[3.05rem]">
          {children}
        </main>
      </div>
    </AppGuard>
  );
}
