"use client";

import Link from "next/link";

export default function InternalErrorPage() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-page">
      <div className="text-center space-y-4 max-w-md px-6">
        <div className="text-6xl font-bold text-text-muted">500</div>
        <h1 className="text-2xl font-bold text-text-primary">Something Went Wrong</h1>
        <p className="text-text-secondary">
          An unexpected error occurred. Please try again later.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="inline-flex items-center justify-center px-6 py-2.5 rounded-xl bg-primary-500 text-white font-medium hover:bg-primary-600 transition-colors min-h-[44px]"
          >
            Try Again
          </button>
          <Link
            href="/"
            className="inline-flex items-center justify-center px-6 py-2.5 rounded-xl border border-border-muted text-text-secondary font-medium hover:bg-hover transition-colors min-h-[44px]"
          >
            Go Home
          </Link>
        </div>
      </div>
    </div>
  );
}
