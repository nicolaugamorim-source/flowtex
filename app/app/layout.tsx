// Layout for the authenticated /app section — wraps pages with the sidebar,
// the subscription/access guard, and the shared data cache provider.
import { AppCacheProvider } from "@/lib/app-cache";
import { SidebarWrapper } from "@/components/app/sidebar-wrapper";
import { AppGuard } from "@/components/app/app-guard";
import { WelcomeOverlay } from "@/components/app/welcome-overlay";
import { MainContentBlur } from "@/components/app/main-content-blur";
import { NotificationButton } from "@/components/app/notification-button";

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AppCacheProvider>
      <AppGuard>
        <WelcomeOverlay />
        <NotificationButton />
        <div className="flex h-screen bg-[var(--color-bg-base)]">
          <SidebarWrapper />
          <MainContentBlur>{children}</MainContentBlur>
        </div>
      </AppGuard>
    </AppCacheProvider>
  );
}
