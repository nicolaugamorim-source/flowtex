"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Mail, Calendar, Database, CheckCircle2, XCircle } from "lucide-react";

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
    return <div>Loading...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Gmail & Calendar */}
      <Card className="border-[#E2EAF1]">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5 text-[#00D4A4]" />
            Google Integration
          </CardTitle>
          <CardDescription>Connect Gmail and Google Calendar</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-[#F8FAFC] rounded-lg border border-[#E2EAF1]">
            <div className="flex items-center gap-3">
              <Mail className="h-4 w-4 text-[#4A6880]" />
              <span className="text-sm font-medium">Gmail</span>
            </div>
            {integrations.gmail_connected ? (
              <CheckCircle2 className="h-5 w-5 text-green-500" />
            ) : (
              <XCircle className="h-5 w-5 text-[#4A6880]/50" />
            )}
          </div>

          <div className="flex items-center justify-between p-4 bg-[#F8FAFC] rounded-lg border border-[#E2EAF1]">
            <div className="flex items-center gap-3">
              <Calendar className="h-4 w-4 text-[#4A6880]" />
              <span className="text-sm font-medium">Google Calendar</span>
            </div>
            {integrations.calendar_connected ? (
              <CheckCircle2 className="h-5 w-5 text-green-500" />
            ) : (
              <XCircle className="h-5 w-5 text-[#4A6880]/50" />
            )}
          </div>

          <p className="text-xs text-[#4A6880]">
            {integrations.google_connected
              ? "Connected! Your Gmail and Calendar are integrated."
              : "Click below to authorize Gmail and Calendar access."}
          </p>

          <Button
            onClick={handleGoogleAuth}
            className="w-full bg-[#00D4A4] hover:bg-[#00C494] text-white"
          >
            {integrations.google_connected ? "Reconnect Google" : "Connect Google"}
          </Button>
        </CardContent>
      </Card>

      {/* Notion */}
      <Card className="border-[#E2EAF1]">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5 text-[#00D4A4]" />
            Notion Integration
          </CardTitle>
          <CardDescription>Connect your Notion workspace</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="notion-key" className="text-[#0D1F2D]">Notion API Key</Label>
            <div className="flex gap-2">
              <Input
                id="notion-key"
                type="password"
                placeholder="Enter your Notion API key"
                value={notionKey}
                onChange={(e) => setNotionKey(e.target.value)}
                className="border-[#E2EAF1]"
              />
              <Button
                onClick={saveNotionKey}
                disabled={saving || !notionKey}
                className="bg-[#00D4A4] hover:bg-[#00C494] text-white"
              >
                {saving ? "Saving..." : "Save"}
              </Button>
            </div>
          </div>

          <div className="flex items-center gap-2 p-4 bg-[#F8FAFC] rounded-lg border border-[#E2EAF1]">
            {integrations.notion_api_key ? (
              <>
                <CheckCircle2 className="h-5 w-5 text-green-500" />
                <span className="text-sm text-[#0D1F2D]">Connected</span>
              </>
            ) : (
              <>
                <XCircle className="h-5 w-5 text-[#4A6880]/50" />
                <span className="text-sm text-[#4A6880]">Not connected</span>
              </>
            )}
          </div>

          <div className="text-xs text-[#4A6880] space-y-2">
            <p>How to get your Notion API key:</p>
            <ol className="list-decimal list-inside space-y-1">
              <li>Go to <a href="https://www.notion.so/my-integrations" target="_blank" rel="noopener noreferrer" className="text-[#00D4A4] hover:underline">notion.so/my-integrations</a></li>
              <li>Create a new integration</li>
              <li>Copy the "Internal Integration Token"</li>
              <li>Paste it above and click Save</li>
            </ol>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
