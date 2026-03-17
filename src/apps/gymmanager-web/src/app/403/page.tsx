import Link from "next/link";

export default function ForbiddenPage() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-background">
      <div className="text-center space-y-4 max-w-md px-6">
        <div className="text-6xl font-bold text-text-muted">403</div>
        <h1 className="text-2xl font-bold text-text-primary">Access Denied</h1>
        <p className="text-text-secondary">
          You do not have permission to view this page. If you believe this is an error,
          please contact your administrator.
        </p>
        <Link
          href="/"
          className="inline-flex items-center justify-center px-6 py-2.5 rounded-xl bg-primary-500 text-white font-medium hover:bg-primary-600 transition-colors"
        >
          Go to Dashboard
        </Link>
      </div>
    </div>
  );
}
