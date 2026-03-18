"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";

export default function ForbiddenPage() {
  const router = useRouter();

  return (
    <div className="flex items-center justify-center min-h-screen bg-page">
      <div className="text-center space-y-4 max-w-md px-6">
        <div className="text-6xl font-bold text-text-muted">403</div>
        <h1 className="text-2xl font-bold text-text-primary">Access Denied</h1>
        <p className="text-text-secondary">
          You do not have permission to view this page. If you believe this is an error,
          please contact your administrator.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link
            href="/"
            className="inline-flex items-center justify-center px-6 py-2.5 rounded-xl bg-primary-500 text-white font-medium hover:bg-primary-600 transition-colors min-h-[44px]"
          >
            Go to Dashboard
          </Link>
          <button
            type="button"
            onClick={() => router.back()}
            className="inline-flex items-center justify-center px-6 py-2.5 rounded-xl border border-border-muted text-text-secondary font-medium hover:bg-hover transition-colors min-h-[44px]"
          >
            Go Back
          </button>
        </div>
      </div>
    </div>
  );
}
