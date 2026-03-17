import { Dumbbell } from "lucide-react";

interface AuthCardProps {
  title: string;
  subtitle: string;
  children: React.ReactNode;
}

export function AuthCard({ title, subtitle, children }: AuthCardProps) {
  return (
    <div className="bg-auth-card-bg backdrop-blur-xl rounded-2xl p-8 shadow-2xl border border-auth-card-border">
      <div className="flex items-center gap-3 mb-8">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center shadow-lg shadow-primary-500/20">
          <Dumbbell className="w-5 h-5 text-white" aria-hidden="true" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight">GymManager</h1>
          <p className="text-text-muted text-[10px] font-medium uppercase tracking-wider">Pro Dashboard</p>
        </div>
      </div>

      <h2 className="text-2xl font-bold text-white mb-1.5 tracking-tight">{title}</h2>
      <p className="text-text-muted text-sm mb-6">{subtitle}</p>

      {children}
    </div>
  );
}
