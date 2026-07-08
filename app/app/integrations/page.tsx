"use client";

// Lets the user connect/disconnect third-party integrations (Google, Notion, etc).
import { useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { IntegrationShowcase, Integration } from "@/components/ui/integration-showcase";
import { IntegrationCard } from "@/components/ui/integration-card";
import { supabase } from "@/lib/supabase";
import { getIntegration } from "@/lib/database";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast-provider";
import { INTEGRATION_ERROR_MESSAGES, getOAuthErrorMessage } from "@/lib/oauth-error-messages";
import { LogOut } from "lucide-react";

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

// Lets the user connect/manage third-party integrations (currently Notion,
// with more planned). Shows connection status and handles the OAuth redirect flow.
export default function IntegrationsPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const toast = useToast();
  const errorShown = useRef(false);
  const [notionConnected, setNotionConnected] = useState(false);
  const [loading, setLoading] = useState(true);
  const [connecting, setConnecting] = useState(false);

  useEffect(() => {
    checkIntegrationsStatus();
  }, []);

  // Re-check status when returning from OAuth callback
  useEffect(() => {
    const notionSuccess = searchParams.get('notion');
    if (notionSuccess === 'success') {
      checkIntegrationsStatus();
    }
  }, [searchParams]);

  // Surface the `?error=` code the Notion callback redirects with on failure
  // (previously silently ignored — the page just looked unchanged).
  useEffect(() => {
    const error = searchParams.get('error');
    if (!error || errorShown.current) return;
    errorShown.current = true;

    toast.show({
      ...getOAuthErrorMessage(error, INTEGRATION_ERROR_MESSAGES),
      tone: "error",
      icon: LogOut,
    });

    router.replace('/app/integrations');
  }, [searchParams, router, toast]);

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
    } catch (error) {
      console.error('Error checking integrations status:', error);
      setNotionConnected(false);
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
    <div className="w-full bg-[var(--color-bg-card)] min-h-screen flex flex-col overflow-x-hidden">
      <div className="w-full max-w-5xl mx-auto" style={{ paddingLeft: "var(--space-4)", paddingRight: "var(--space-4)", paddingTop: "var(--space-8)", paddingBottom: "var(--space-8)" }}>
        <IntegrationShowcase
          title="Integrate with your ~favorite tools~"
          integrations={integrationsData}
          onIntegrationClick={handleIntegrationClick}
          renderCustomCard={(integration) => {
            if (integration.name === 'Notion') {
              return (
                <div key={integration.name} className="sm:col-span-2 lg:col-span-2 xl:col-span-2">
                  <IntegrationCard
                    name={integration.name}
                    description={integration.description}
                    icon={<img src="https://cdn.worldvectorlogo.com/logos/notion-2.svg" alt="Notion" className="h-6 w-6" />}
                    isConnected={notionConnected}
                    isLoading={connecting}
                    onConnect={handleNotionConnect}
                  >
                    <div className="text-[var(--color-text-muted)]" style={{ fontSize: "var(--text-sm)" }}>
                      {notionConnected ? 'Your Notion workspace is connected' : 'Click Connect to link your Notion workspace'}
                    </div>
                  </IntegrationCard>
                </div>
              );
            }
            return null;
          }}
        />
      </div>
    </div>
  );
}
