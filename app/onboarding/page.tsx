"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasTriedSubmit, setHasTriedSubmit] = useState(false);

  // Step 1 - About your business
  const [fullName, setFullName] = useState("");
  const [businessName, setBusinessName] = useState("");
  const [businessType, setBusinessType] = useState("");
  const [industry, setIndustry] = useState("");
  const [clients, setClients] = useState("");

  // Step 2 - Project context
  const [businessBrief, setBusinessBrief] = useState("");
  const [toolsUsed, setToolsUsed] = useState("");

  useEffect(() => {
    // Get user data from session
    const checkUser = async () => {
      try {
        // Import Supabase client to get user metadata
        const { createBrowserClient } = await import("@supabase/ssr");
        const supabase = createBrowserClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
        );

        const { data: { user } } = await supabase.auth.getUser();

        if (user?.user_metadata?.full_name) {
          setFullName(user.user_metadata.full_name);
        }

        // Also get profile to check onboarding status
        const response = await fetch("/api/user/profile");
        if (response.ok) {
          const { profile } = await response.json();
          if (profile && profile.onboarding_completed) {
            router.push("/app");
            return;
          }
        }
      } catch (error) {
        console.error("Error fetching user data:", error);
      }
      setIsLoading(false);
    };

    checkUser();
  }, [router]);

  const handleNextStep = async (e: React.FormEvent) => {
    e.preventDefault();
    setHasTriedSubmit(true);

    if (step === 1) {
      // Validate step 1
      if (!fullName.trim() || !businessName.trim() || !businessType.trim()) {
        setError("Please fill in all required fields");
        return;
      }
      setError(null);
      setStep(2);
    } else {
      // Submit the form
      await handleSubmit();
    }
  };

  const handleSkip = () => {
    // Skip to pricing with minimal data
    setStep(2);
  };

  const handleSubmit = async () => {
    setIsSaving(true);
    setError(null);

    try {
      const response = await fetch("/api/auth/onboarding", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          full_name: fullName,
          business_name: businessName,
          business_type: businessType,
          industry: industry,
          clients_description: clients,
          business_brief: businessBrief,
          tools_used: toolsUsed,
          onboarding_completed: true,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to save onboarding");
      }

      console.log("✅ Onboarding completed");
      router.push("/pricing");
    } catch (err) {
      console.error("❌ Onboarding error:", err);
      setError(err instanceof Error ? err.message : "Failed to save onboarding");
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <img src="/logo.svg" alt="Flowtex" width={48} height={48} className="mx-auto mb-6" />
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Welcome to Flowtex</h1>
          <p className="text-lg text-gray-600">Let's set up your workspace in 2 steps</p>
        </div>

        {/* Progress Indicator */}
        <div className="mb-12">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-4">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold text-sm transition-colors ${
                  step >= 1
                    ? "bg-[var(--color-accent)] text-white"
                    : "bg-gray-200 text-gray-600"
                }`}
              >
                1
              </div>
              <span className="text-gray-700 font-medium">About your business</span>
            </div>

            <div
              className={`flex-1 h-1 mx-4 transition-colors ${
                step >= 2 ? "bg-[var(--color-accent)]" : "bg-gray-200"
              }`}
            ></div>

            <div
              className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold text-sm transition-colors ${
                step >= 2
                  ? "bg-[var(--color-accent)] text-white"
                  : "bg-gray-200 text-gray-600"
              }`}
            >
              2
            </div>
            <span className="text-gray-700 font-medium ml-4">Your project context</span>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleNextStep} className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
          {error && hasTriedSubmit && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-800 text-sm">
              {error}
            </div>
          )}

          {step === 1 && (
            <div className="space-y-6">
              {/* Full Name */}
              <div>
                <Label htmlFor="fullName" className="text-gray-900 block text-sm font-medium">
                  Full Name
                </Label>
                <Input
                  id="fullName"
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Your name"
                  className="mt-2 bg-white border-gray-200"
                  disabled
                />
                <p className="mt-1 text-xs text-gray-500">From your Google account</p>
              </div>

              {/* Business Name */}
              <div>
                <Label htmlFor="businessName" className="text-gray-900 block text-sm font-medium">
                  Business Name <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="businessName"
                  type="text"
                  value={businessName}
                  onChange={(e) => setBusinessName(e.target.value)}
                  placeholder="Your company or project name"
                  className="mt-2 bg-white border-gray-200"
                />
              </div>

              {/* Business Type */}
              <div>
                <Label htmlFor="businessType" className="text-gray-900 block text-sm font-medium">
                  Business Type <span className="text-red-500">*</span>
                </Label>
                <Select value={businessType} onValueChange={setBusinessType}>
                  <SelectTrigger className="mt-2 bg-white border-gray-200">
                    <SelectValue placeholder="Select your business type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="solopreneur">Solopreneur</SelectItem>
                    <SelectItem value="agency">Agency</SelectItem>
                    <SelectItem value="startup">Startup</SelectItem>
                    <SelectItem value="freelancer">Freelancer</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Industry */}
              <div>
                <Label htmlFor="industry" className="text-gray-900 block text-sm font-medium">
                  Industry
                </Label>
                <Input
                  id="industry"
                  type="text"
                  value={industry}
                  onChange={(e) => setIndustry(e.target.value)}
                  placeholder="e.g. Design, Tech, Marketing"
                  className="mt-2 bg-white border-gray-200"
                />
                <p className="mt-1 text-xs text-gray-500">Optional</p>
              </div>

              {/* Clients */}
              <div>
                <Label htmlFor="clients" className="text-gray-900 block text-sm font-medium">
                  Who are your clients?
                </Label>
                <textarea
                  id="clients"
                  value={clients}
                  onChange={(e) => setClients(e.target.value)}
                  placeholder="Describe your typical clients or customer base"
                  className="mt-2 w-full px-3 py-2 border border-gray-200 rounded-lg bg-white text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)] focus:border-transparent resize-none"
                  rows={4}
                />
                <p className="mt-1 text-xs text-gray-500">Optional</p>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-6">
              {/* Business Brief */}
              <div>
                <Label htmlFor="businessBrief" className="text-gray-900 block text-sm font-medium">
                  Business Brief
                </Label>
                <textarea
                  id="businessBrief"
                  value={businessBrief}
                  onChange={(e) => setBusinessBrief(e.target.value)}
                  placeholder="Tell Flowtex about your business — what you're building, your main goals, your key clients. This is the context your AI will always have."
                  className="mt-2 w-full px-3 py-2 border border-gray-200 rounded-lg bg-white text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)] focus:border-transparent resize-none"
                  rows={6}
                />
                <p className="mt-1 text-xs text-gray-500">Optional but highly recommended</p>
              </div>

              {/* Tools Used */}
              <div>
                <Label htmlFor="toolsUsed" className="text-gray-900 block text-sm font-medium">
                  Main tools you use
                </Label>
                <Input
                  id="toolsUsed"
                  type="text"
                  value={toolsUsed}
                  onChange={(e) => setToolsUsed(e.target.value)}
                  placeholder="e.g. Notion, Gmail, Slack, Linear"
                  className="mt-2 bg-white border-gray-200"
                />
                <p className="mt-1 text-xs text-gray-500">Optional</p>
              </div>
            </div>
          )}

          {/* Buttons */}
          <div className="mt-8 flex gap-4">
            {step === 2 && (
              <Button
                type="button"
                variant="outline"
                onClick={handleSkip}
                disabled={isSaving}
                className="flex-1 border-gray-200 text-gray-900"
              >
                Skip for now
              </Button>
            )}
            <Button
              type="submit"
              disabled={isSaving}
              className={`flex-1 ${
                isSaving ? "opacity-50 cursor-not-allowed" : ""
              } bg-[var(--color-accent)] text-white hover:bg-[var(--color-accent-hover)]`}
            >
              {isSaving ? "Saving..." : step === 1 ? "Continue" : "Complete onboarding"}
            </Button>
          </div>
        </form>

        {/* Footer */}
        <p className="mt-8 text-center text-sm text-gray-600">
          You can update this information anytime in settings
        </p>
      </div>
    </div>
  );
}
