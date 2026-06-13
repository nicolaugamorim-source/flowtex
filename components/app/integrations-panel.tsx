"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { IntegrationCard } from "@/components/ui/integration-card";
import { Mail, Calendar, Database } from "lucide-react";

interface Integration {
  notion_api_key?: string;
  google_connected?: boolean;
  gmail_connected?: boolean;
  calendar_connected?: boolean;
}

export function IntegrationsPanel() {
  const [integrations, setIntegrations] = useState<Integration>({});
  const [notionKey, setNotionKey] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    loadIntegrations();
  }, []);

  async function loadIntegrations() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      setUserId(user.id);

      const { data } = await supabase
        .from("user_integrations")
        .select("*")
        .eq("id", user.id)
        .single();

      if (data) {
        setIntegrations(data);
        setNotionKey(data.notion_api_key || "");
      }
    } catch (error) {
      console.error("Error loading integrations:", error);
    } finally {
      setLoading(false);
    }
  }

  async function saveNotionKey() {
    if (!userId) return;
    setSaving(true);

    try {
      const { error } = await supabase
        .from("user_integrations")
        .upsert({
          id: userId,
          notion_api_key: notionKey || null,
        }, {
          onConflict: "id"
        });

      if (error) throw error;

      setIntegrations(prev => ({
        ...prev,
        notion_api_key: notionKey
      }));
    } catch (error) {
      console.error("Error saving Notion key:", error);
    } finally {
      setSaving(false);
    }
  }

  async function handleGoogleAuth() {
    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${typeof window !== "undefined" ? window.location.origin : ""}/auth/callback?integrations=true`,
          scopes: "https://www.googleapis.com/auth/gmail.modify https://www.googleapis.com/auth/calendar",
        },
      });

      if (error) throw error;
    } catch (error) {
      console.error("Error with Google auth:", error);
    }
  }

  if (loading) {
    return <div className="text-center py-8 text-[#4A6880]">Loading integrations...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Google Integration Card */}
      <IntegrationCard
        name="Google"
        description="Connect Gmail and Google Calendar to manage emails and schedules"
        icon={<Mail className="h-6 w-6 text-[#00D4A4]" />}
        isConnected={integrations.google_connected || false}
      >
        <div className="space-y-3">
          {/* Gmail Status */}
          <div className="p-3 bg-[#F8FAFC] rounded-lg border border-[#E2EAF1]">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-[#4A6880]" />
                <span className="text-sm font-medium text-[#0D1F2D]">Gmail</span>
              </div>
              <span className="text-xs px-2 py-1 rounded bg-[#00D4A4]/10 text-[#00D4A4] font-medium">
                {integrations.gmail_connected ? "Active" : "Inactive"}
              </span>
            </div>
          </div>

          {/* Calendar Status */}
          <div className="p-3 bg-[#F8FAFC] rounded-lg border border-[#E2EAF1]">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-[#4A6880]" />
                <span className="text-sm font-medium text-[#0D1F2D]">Google Calendar</span>
              </div>
              <span className="text-xs px-2 py-1 rounded bg-[#00D4A4]/10 text-[#00D4A4] font-medium">
                {integrations.calendar_connected ? "Active" : "Inactive"}
              </span>
            </div>
          </div>

          {/* CTA Button */}
          <Button
            onClick={handleGoogleAuth}
            className="w-full bg-[#00D4A4] hover:bg-[#00C494] text-white font-medium transition-all duration-300"
          >
            {integrations.google_connected ? "Reconnect Google" : "Connect with Google"}
          </Button>
        </div>
      </IntegrationCard>

      {/* Notion Integration Card */}
      <IntegrationCard
        name="Notion"
        description="Sync your Notion databases with your workspace"
        icon={<Database className="h-6 w-6 text-[#00D4A4]" />}
        isConnected={!!integrations.notion_api_key}
      >
        <div className="space-y-3">
          {/* API Key Input */}
          <div className="space-y-2">
            <Label htmlFor="notion-key" className="text-sm font-medium text-[#0D1F2D]">
              API Key
            </Label>
            <div className="flex gap-2">
              <Input
                id="notion-key"
                type="password"
                placeholder="Enter your Notion API key"
                value={notionKey}
                onChange={(e) => setNotionKey(e.target.value)}
                className="border-[#E2EAF1] focus:border-[#00D4A4] focus:ring-[#00D4A4]/20 text-[#0D1F2D]"
              />
              <Button
                onClick={saveNotionKey}
                disabled={saving || !notionKey}
                className="bg-[#00D4A4] hover:bg-[#00C494] text-white font-medium transition-all duration-300 disabled:opacity-50"
              >
                {saving ? "Saving..." : "Save"}
              </Button>
            </div>
          </div>

          {/* Instructions */}
          <div className="p-3 bg-[#F8FAFC] rounded-lg border border-[#E2EAF1]">
            <p className="text-xs font-semibold text-[#0D1F2D] mb-2">How to get your API key:</p>
            <ol className="text-xs text-[#4A6880] space-y-1 list-decimal list-inside">
              <li>Go to <a href="https://www.notion.so/my-integrations" target="_blank" rel="noopener noreferrer" className="text-[#00D4A4] hover:underline font-medium">notion.so/my-integrations</a></li>
              <li>Create a new integration</li>
              <li>Copy the "Internal Integration Token"</li>
              <li>Paste it above and click Save</li>
            </ol>
          </div>
        </div>
      </IntegrationCard>

      {/* Coming Soon Section */}
      <div className="pt-4 border-t border-[#E2EAF1]">
        <h3 className="text-sm font-semibold text-[#0D1F2D] mb-4">Coming Soon</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 opacity-50">
          <div className="p-4 rounded-lg border border-[#E2EAF1] bg-[#F8FAFC]">
            <p className="text-sm font-medium text-[#0D1F2D]">Slack</p>
            <p className="text-xs text-[#4A6880] mt-1">Send notifications to Slack</p>
          </div>
          <div className="p-4 rounded-lg border border-[#E2EAF1] bg-[#F8FAFC]">
            <p className="text-sm font-medium text-[#0D1F2D]">Zapier</p>
            <p className="text-xs text-[#4A6880] mt-1">Connect to 5000+ apps</p>
          </div>
        </div>
      </div>
    </div>
  );
}
