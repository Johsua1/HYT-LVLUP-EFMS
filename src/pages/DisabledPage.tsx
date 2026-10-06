import { LogOut, ShieldOff } from 'lucide-react';
import { useAuth } from '@/auth/AuthProvider';
import { AuthFrame, Notice } from '@/components/auth/AuthFrame';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';

/**
 * Shown when a signed-in account has been disabled. Row Level Security blocks
 * every agency table for a disabled profile, so even if the UI were bypassed
 * the account cannot read or write data.
 */
export default function DisabledPage() {
  const { profile, signOut } = useAuth();
  return (
    <AuthFrame>
      <Card className="p-5 sm:p-6">
        <div className="mb-4 flex items-center gap-2">
          <span className="bg-rose-50 text-rose-700 flex h-8 w-8 items-center justify-center rounded-md">
            <ShieldOff className="h-4 w-4" />
          </span>
          <div>
            <h2 className="text-ink-900 text-sm font-semibold">Account disabled</h2>
            <p className="text-ink-500 text-xs">{profile?.email}</p>
          </div>
        </div>
        <Notice tone="error">
          This account has been disabled by an administrator and can no longer access EFMS. If you believe this is a
          mistake, contact your workspace administrator.
        </Notice>
        <div className="mt-4">
          <Button variant="outline" size="lg" block icon={<LogOut />} onClick={() => void signOut()}>
            Sign out
          </Button>
        </div>
      </Card>
    </AuthFrame>
  );
}
