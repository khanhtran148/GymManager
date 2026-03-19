import Link from "next/link";

export default function UnauthorizedPage() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-page">
      <div className="text-center space-y-4 max-w-md px-6">
        <div className="text-6xl font-bold text-text-muted">401</div>
        <h1 className="text-2xl font-bold text-text-primary">Session Expired</h1>
        <p className="text-text-secondary">
          Your session has expired. Please log in again to continue.
        </p>
        <Link
          href="/login"
          className="inline-flex items-center justify-center px-6 py-2.5 rounded-xl bg-primary-500 text-white font-medium hover:bg-primary-600 transition-colors"
        >
          Go to Login
        </Link>
      </div>
    </div>
  );
}
