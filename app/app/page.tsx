import { AppSidebar } from "@/components/app/app-sidebar";
import { AppDashboard } from "@/components/app/app-dashboard";
import { AppGuard } from "@/components/app/app-guard";

export default function AppPage() {
  return (
    <AppGuard>
      <div className="flex h-screen bg-[#F8FAFC]">
        <AppSidebar />
        <AppDashboard />
      </div>
    </AppGuard>
  );
}
