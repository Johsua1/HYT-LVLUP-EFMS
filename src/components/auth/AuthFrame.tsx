import type { ReactNode } from 'react';
import { AlertCircle, CheckCircle2, ShieldCheck } from 'lucide-react';
import logo from '@/images/LEVELUPLOGO.png';

/** Shared chrome for every pre-app screen (sign in, MFA, account setup). */
export function AuthFrame({ children }: { children: ReactNode }) {
  return (
    <div className="bg-ink-100 flex min-h-screen items-center justify-center px-4 py-10">
      <div className="w-full max-w-md">
        <div className="mb-6 flex flex-col items-center text-center">
          <img
            src={logo}
            alt="Level Up International Manpower Services Corp."
            className="h-14 w-auto rounded-lg bg-white p-1.5 shadow-sm"
          />
          <h1 className="text-ink-900 mt-4 text-lg font-semibold">Employer Filtering Management System</h1>
          <p className="text-ink-500 mt-1 text-xs">Level Up International Manpower Services Corp.</p>
        </div>
        {children}
        <p className="text-ink-400 mt-6 text-center text-[11px]">
          Authorised personnel only. All access is logged.
        </p>
      </div>
    </div>
  );
}

export function Notice({
  tone,
  children,
}: {
  tone: 'error' | 'success' | 'info';
  children: ReactNode;
}) {
  const styles = {
    error: 'border-rose-200 bg-rose-50 text-rose-700',
    success: 'border-emerald-200 bg-emerald-50 text-emerald-700',
    info: 'border-brand-200 bg-brand-50 text-brand-800',
  }[tone];
  const Icon = tone === 'success' ? CheckCircle2 : tone === 'error' ? AlertCircle : ShieldCheck;
  return (
    <div className={`flex items-start gap-2.5 rounded-lg border px-3 py-2.5 text-xs leading-relaxed ${styles}`}>
      <Icon className="mt-0.5 h-4 w-4 shrink-0" />
      <div>{children}</div>
    </div>
  );
}
