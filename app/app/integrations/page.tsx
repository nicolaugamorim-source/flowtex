"use client";

import { IntegrationShowcase, Integration } from "@/components/ui/integration-showcase";

const integrationsData: Integration[] = [
  {
    name: 'Notion',
    description: 'Sync your Notion databases.',
    iconSrc: 'https://cdn.worldvectorlogo.com/logos/notion-2.svg',
  },
  {
    name: 'More Coming',
    description: 'Many more integrations in development.',
    iconSrc: 'https://img.icons8.com/ios-glyphs/60/plus-math.png',
  },
];

export default function IntegrationsPage() {
  return (
    <div className="w-full bg-white">
      <IntegrationShowcase
        title="Integrate with your ~favorite~ tools"
        integrations={integrationsData}
      />
    </div>
  );
}
