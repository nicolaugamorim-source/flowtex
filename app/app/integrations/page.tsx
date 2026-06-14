"use client";

import { useEffect, useState } from "react";
import { IntegrationShowcase, Integration } from "@/components/ui/integration-showcase";
import { IntegrationCard } from "@/components/ui/integration-card";
import { Database } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { getIntegration } from "@/lib/database";

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
  const [notionConnected, setNotionConnected] = useState(false);
  const [googleConnected, setGoogleConnected] = useState(false);
  const [loading, setLoading] = useState(true);
  const [connecting, setConnecting] = useState(false);

  useEffect(() => {
    checkIntegrationsStatus();
  }, []);

  async function checkIntegrationsStatus() {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();

      if (!user?.id) {
        setLoading(false);
        return;
      }

      // Check Notion integration from database
      const notionIntegration = await getIntegration(user.id, 'notion');
      setNotionConnected(notionIntegration?.is_active === true);

      // Check Google integration from database
      const googleIntegration = await getIntegration(user.id, 'google');
      setGoogleConnected(googleIntegration?.is_active === true);
    } catch (error) {
      console.error('Error checking integrations status:', error);
      setNotionConnected(false);
      setGoogleConnected(false);
    } finally {
      setLoading(false);
    }
  }

  const handleNotionConnect = async () => {
    setConnecting(true);
    try {
      // Get the access token from Supabase session
      const { data: { session } } = await supabase.auth.getSession();

      if (!session?.access_token) {
        console.error('No session found');
        setConnecting(false);
        return;
      }

      const response = await fetch('/api/auth/notion/prepare', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();
      if (data.authUrl) {
        window.location.href = data.authUrl;
      } else {
        console.error('Failed to get auth URL:', data.error);
        setConnecting(false);
      }
    } catch (error) {
      console.error('Error preparing Notion OAuth:', error);
      setConnecting(false);
    }
  };

  const handleIntegrationClick = (name: string) => {
    if (name === 'Notion') {
      handleNotionConnect();
    }
  };

  return (
    <div className="w-full bg-white min-h-screen flex flex-col">
      <IntegrationShowcase
        title="Integrate with your ~favorite tools~"
        integrations={integrationsData}
        onIntegrationClick={handleIntegrationClick}
        renderCustomCard={(integration) => {
          if (integration.name === 'Notion') {
            return (
              <IntegrationCard
                key={integration.name}
                name={integration.name}
                description={integration.description}
                icon={<Database className="h-6 w-6 text-[#00D4A4]" />}
                isConnected={notionConnected}
                isLoading={connecting}
                onConnect={handleNotionConnect}
              >
                <div className="text-sm text-[#4A6880]">
                  {notionConnected ? 'Your Notion workspace is connected' : 'Click Connect to link your Notion workspace'}
                </div>
              </IntegrationCard>
            );
          }
          return null;
        }}
      />
    </div>
  );
}
