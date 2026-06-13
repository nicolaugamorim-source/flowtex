"use client";

import { IntegrationsPanel } from "@/components/app/integrations-panel";

export default function IntegrationsPage() {
  return (
    <div className="flex flex-col h-full">
      <div className="p-8 flex-1">
        <div className="max-w-2xl">
          <h1 className="text-3xl font-bold text-[#0D1F2D] mb-2">Integrations</h1>
          <p className="text-[#4A6880] mb-8">Connect your favorite tools to enhance your workflow</p>
          <IntegrationsPanel />
        </div>
      </div>
    </div>
  );
}
