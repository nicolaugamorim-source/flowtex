"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function DevLogin() {
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
    <div className="min-h-screen flex items-center justify-center bg-[#080810]">
      <div className="bg-[#F8FAFC] rounded-2xl p-8 max-w-md w-full">
        <h1 className="text-2xl font-bold text-[#0D1F2D] mb-4">Dev Login</h1>

        <p className="text-[#4A6880] mb-6">
          Use este login de teste enquanto debugamos o Google OAuth
        </p>

        <button
          onClick={handleTestLogin}
          className="w-full bg-[#00D4A4] text-white py-3 rounded-lg font-semibold mb-4"
        >
          Entrar com Token de Teste
        </button>

        <p className="text-xs text-[#4A6880] mb-2">Token de teste:</p>
        <div className="bg-gray-100 p-3 rounded text-xs break-words flex items-center justify-between">
          <span>{testToken.substring(0, 30)}...</span>
          <button
            onClick={copyToken}
            className="text-[#00D4A4] ml-2"
          >
            {copied ? "✓" : "📋"}
          </button>
        </div>
      </div>
    </div>
  );
}
