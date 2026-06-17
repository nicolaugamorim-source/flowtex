import { AppCacheProvider } from "@/lib/app-cache";
import { SidebarWrapper } from "@/components/app/sidebar-wrapper";
import { AppGuard } from "@/components/app/app-guard";

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AppCacheProvider>
      <AppGuard>
        <div className="flex h-screen bg-[var(--color-bg-base)]">
          <SidebarWrapper />
          <main className="flex-1 ml-[3.05rem]">
            {children}
          </main>
        </div>
      </AppGuard>
    </AppCacheProvider>
  );
}
