"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";

export function UpgradeRequired() {
  return (
    <div className="w-full h-screen bg-gradient-to-b from-indigo-900 via-indigo-800 to-indigo-900 flex items-center justify-center p-4">
      <div className="max-w-md text-center">
        <div className="mb-6">
          <h1 className="text-4xl font-bold text-white mb-2">
            Upgrade Required
          </h1>
          <p className="text-indigo-200 text-lg">
            You haven't selected a plan yet. Choose a plan to get started.
          </p>
        </div>

        <div className="bg-white/10 backdrop-blur border border-white/20 rounded-lg p-8 mb-8">
          <p className="text-indigo-100 text-base leading-relaxed">
            Select a pricing plan that fits your needs and unlock the full power of Flowtex.
          </p>
        </div>

        <Link
          href="/#pricing"
          className="inline-flex items-center gap-2 bg-white text-indigo-900 font-semibold px-6 py-3 rounded-lg hover:bg-indigo-50 transition-colors"
        >
          View Pricing
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    </div>
  );
}
