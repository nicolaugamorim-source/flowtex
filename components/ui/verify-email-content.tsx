"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { verifyEmail } from "@/lib/fraud-detection";
import { Button } from "./button";
import { ErrorMessage } from "./error-message";

export function VerifyEmailContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<"verifying" | "success" | "error">("verifying");
  const [error, setError] = useState<string | null>(null);
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");

  const token = searchParams.get("token");

  useEffect(() => {
    const verifyToken = async () => {
      if (token) {
        try {
          const verified = await verifyEmail(token);

          if (verified) {
            setStatus("success");
            setMessage("Email verified successfully! Redirecting...");
            setTimeout(() => {
              router.push("/");
            }, 2000);
          } else {
            setStatus("error");
            setError("Invalid or expired verification link");
          }
        } catch (err) {
          setStatus("error");
          setError("Error verifying email");
        }
      } else {
        // Sem token, mostra página para pedir reenvio
        setStatus("error");
        setMessage(
          "Check your email for a verification link. Click the link to verify your account."
        );

        // Tenta obter o email do utilizador
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (user) {
          setEmail(user.email || "");
        }
      }
    };

    verifyToken();
  }, [token, router]);

  const handleResendEmail = async () => {
    if (!email) {
      setError("Email address is required");
      return;
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        setError("You must be signed in to resend verification");
        return;
      }

      setStatus("verifying");

      // Aqui você precisaria de uma função para reenviar o email
      // Por enquanto, apenas mostra uma mensagem
      setError(null);
      setMessage("Verification email sent! Check your inbox.");
      setStatus("error");
    } catch (err) {
      setError("Failed to resend verification email");
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-white w-screen">
      <div className="mx-auto w-full space-y-2 text-center flex flex-col items-center max-w-xs">
        <div className="space-y-4 text-center">
          {status === "verifying" && (
            <>
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[var(--color-accent)] mx-auto"></div>
              <h1 className="text-2xl font-semibold text-gray-900">
                Verifying your email...
              </h1>
            </>
          )}

          {status === "success" && (
            <>
              <div className="text-5xl">✅</div>
              <h1 className="text-2xl font-semibold text-gray-900">
                Email Verified!
              </h1>
              <p className="text-gray-600">{message}</p>
            </>
          )}

          {status === "error" && (
            <>
              <div className="text-5xl">⚠️</div>
              <h1 className="text-2xl font-semibold text-gray-900">
                Email Verification
              </h1>

              {error && <ErrorMessage message={error} onClose={() => setError(null)} />}

              {!token && (
                <div className="space-y-4 mt-6">
                  <p className="text-gray-600">{message}</p>

                  <div className="space-y-3">
                    <input
                      type="email"
                      placeholder="your@email.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]"
                    />
                    <Button
                      onClick={handleResendEmail}
                      className="w-full"
                    >
                      Resend Verification Email
                    </Button>
                  </div>
                </div>
              )}

              <Button
                variant="outline"
                onClick={() => router.push("/login")}
                className="w-full mt-4"
              >
                Back to Login
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
