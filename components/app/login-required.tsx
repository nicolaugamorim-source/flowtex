"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";

export function LoginRequired() {
  return (
    <div className="w-full h-screen bg-gradient-to-b from-indigo-900 via-indigo-800 to-indigo-900 flex items-center justify-center p-4">
      <div className="max-w-md text-center">
        <div className="mb-6">
          <h1 className="text-4xl font-bold text-white mb-2">
            You're not logged in
          </h1>
          <p className="text-indigo-200 text-lg">
            Log in to access your Flowtex dashboard.
          </p>
        </div>

        <Link
          href="/login"
          className="inline-flex items-center gap-2 bg-white text-indigo-900 font-semibold px-6 py-3 rounded-lg hover:bg-indigo-50 transition-colors"
        >
          Go to login
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    </div>
  );
}
