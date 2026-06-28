"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";

export function OnboardingRequired() {
  return (
    <div className="w-full h-screen bg-gradient-to-b from-indigo-900 via-indigo-800 to-indigo-900 flex items-center justify-center p-4">
      <div className="max-w-md text-center">
        <div className="mb-6">
          <h1 className="text-4xl font-bold text-white mb-2">
            Finish setting up your account
          </h1>
          <p className="text-indigo-200 text-lg">
            We still need a few details about you and your business before you can use Flowtex.
          </p>
        </div>

        <Link
          href="/onboarding"
          className="inline-flex items-center gap-2 bg-white text-indigo-900 font-semibold px-6 py-3 rounded-lg hover:bg-indigo-50 transition-colors"
        >
          Complete onboarding
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    </div>
  );
}
