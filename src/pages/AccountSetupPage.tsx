import { useState, type FormEvent } from 'react';
import { KeyRound, LogOut, UserCheck } from 'lucide-react';
import { useAuth } from '@/auth/AuthProvider';
import { AuthFrame, Notice } from '@/components/auth/AuthFrame';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';

/**
 * First-run password change for invited staff.
 *
 * Staff sign in with the temporary password from their invitation email; the
 * profile stays `invited` (no access to agency data) until they choose a new
 * password here. The password is set through Supabase Auth and the profile is
 * then promoted to `active` server-side.
 */
export default function AccountSetupPage() {
  const { profile, updatePassword, acceptInvitation, signOut } = useAuth();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setError(null);
    if (password.length < 8) {
      setError('Choose a password of at least 8 characters.');
      return;
    }
    if (password !== confirm) {
      setError('The two passwords do not match.');
      return;
    }
    setBusy(true);
    const pwd = await updatePassword(password);
    if (pwd.error) {
      setBusy(false);
      setError(pwd.error);
      return;
    }
    const accepted = await acceptInvitation();
    setBusy(false);
    if (accepted.error) {
      setError(accepted.error);
      return;
    }
    /* The app gate re-renders once the profile is `active`. */
  };

  return (
    <AuthFrame>
      <Card className="p-5 sm:p-6">
        <div className="mb-4 flex items-center gap-2">
          <span className="bg-brand-50 text-brand-700 flex h-8 w-8 items-center justify-center rounded-md">
            <UserCheck className="h-4 w-4" />
          </span>
          <div>
            <h2 className="text-ink-900 text-sm font-semibold">Complete your account setup</h2>
            <p className="text-ink-500 text-xs">{profile?.email}</p>
          </div>
        </div>

        <div className="mb-4"><Notice tone="info">
          You signed in with a temporary password. Choose a new password to continue — you will use your email and this
          new password from now on.
        </Notice></div>

        <form onSubmit={submit} className="flex flex-col gap-3.5" noValidate>
          {error && <Notice tone="error">{error}</Notice>}

          <Input
            label="New password *"
            name="password"
            type="password"
            icon={<KeyRound />}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="At least 8 characters"
            autoComplete="new-password"
            required
          />
          <Input
            label="Confirm password *"
            name="confirm"
            type="password"
            icon={<KeyRound />}
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            placeholder="Repeat your password"
            autoComplete="new-password"
            required
          />
          <Button type="submit" variant="primary" size="lg" block loading={busy} icon={<UserCheck />}>
            Activate account
          </Button>
        </form>

        <div className="border-ink-200 mt-4 border-t pt-4">
          <Button variant="ghost" size="sm" block icon={<LogOut />} onClick={() => void signOut()}>
            Sign out
          </Button>
        </div>
      </Card>
    </AuthFrame>
  );
}
