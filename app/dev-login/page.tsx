"use client";

import { useRouter, notFound } from "next/navigation";
import { useState } from "react";

// Developer-only helper page for injecting a fake Google token into
// localStorage, so local testing doesn't require a real OAuth round-trip.
export default function DevLogin() {
  // Only allow in development, mirroring app/api/streak/debug/route.ts.
  if (process.env.NODE_ENV !== "development") {
    notFound();
  }

  const router = useRouter();
  const [copied, setCopied] = useState(false);

  const testToken = "ya29.a0AfH6SMBz_example_test_token_only_for_development";

  const handleTestLogin = () => {
    // Store test token in localStorage
    localStorage.setItem("test_google_token", testToken);

    // Simulate login
    localStorage.setItem("user_logged_in", "true");

    router.push("/app");
  };

  const copyToken = () => {
    navigator.clipboard.writeText(testToken);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--color-bg-base)]">
      <div className="bg-[var(--color-bg-base)] rounded-2xl p-8 max-w-md w-full">
        <h1 className="text-2xl font-bold text-[var(--color-text-primary)] mb-4">Dev Login</h1>

        <p className="text-[var(--color-text-muted)] mb-6">
          Use este login de teste enquanto debugamos o Google OAuth
        </p>

        <button
          onClick={handleTestLogin}
          className="w-full bg-[var(--color-accent)] text-white py-3 rounded-lg font-semibold mb-4"
        >
          Entrar com Token de Teste
        </button>

        <p className="text-xs text-[var(--color-text-muted)] mb-2">Token de teste:</p>
        <div className="bg-gray-100 p-3 rounded text-xs break-words flex items-center justify-between">
          <span>{testToken.substring(0, 30)}...</span>
          <button
            onClick={copyToken}
            className="text-[var(--color-accent)] ml-2"
          >
            {copied ? "✓" : "📋"}
          </button>
        </div>
      </div>
    </div>
  );
}
