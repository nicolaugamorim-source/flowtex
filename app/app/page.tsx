import { AppSidebar } from "@/components/app/app-sidebar";
import { AppDashboard } from "@/components/app/app-dashboard";

export default function AppPage() {
  return (
    <div className="flex h-screen bg-[#F8FAFC]">
      <AppSidebar />
      <AppDashboard />
    </div>
  );
}
