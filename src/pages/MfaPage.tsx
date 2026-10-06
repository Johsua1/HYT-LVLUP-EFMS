import { useState, type FormEvent } from 'react';
import { KeyRound, LogOut, QrCode, ShieldCheck, Smartphone } from 'lucide-react';
import { useAuth, type MfaEnrollment } from '@/auth/AuthProvider';
import { AuthFrame, Notice } from '@/components/auth/AuthFrame';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';

/**
 * Administrator MFA gate.
 *
 * Rendered whenever an administrator is signed in but has not reached AAL2 —
 * either because they have no authenticator enrolled yet (enrolment step) or
 * because they must supply the current 6-digit code (challenge step). The app
 * never renders a protected route until this screen resolves.
 */
export default function MfaPage() {
  const { profile, mfaEnrolled, mfaFactorId, enrollMfa, verifyMfa, unenrollMfa, signOut } = useAuth();

  const [enrollment, setEnrollment] = useState<MfaEnrollment | null>(null);
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const beginEnrollment = async () => {
    setError(null);
    setBusy(true);
    const result = await enrollMfa();
    setBusy(false);
    if (result.error || !result.data) {
      setError(result.error ?? 'Could not start enrollment.');
      return;
    }
    setEnrollment(result.data);
  };

  const cancelEnrollment = async () => {
    if (enrollment) await unenrollMfa(enrollment.factorId);
    setEnrollment(null);
    setCode('');
    setError(null);
  };

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setError(null);
    if (!/^\d{6}$/.test(code.trim())) {
      setError('Enter the 6-digit code from your authenticator app.');
      return;
    }
    /* Enrolling: the factor id comes from the fresh enrollment. Challenging:
       it is the id of the already-verified factor. */
    const factorId = enrollment?.factorId ?? mfaFactorId ?? '';
    if (!factorId) {
      setError('No authenticator is enrolled yet. Reload the page to set one up.');
      return;
    }
    setBusy(true);
    const result = await verifyMfa(factorId, code.trim());
    setBusy(false);
    if (result.error) {
      setError(result.error);
      setCode('');
      return;
    }
    /* Success — the assurance level is now AAL2 and the app renders. */
  };

  return (
    <AuthFrame>
      <Card className="p-5 sm:p-6">
        <div className="mb-4 flex items-center gap-2">
          <span className="bg-brand-50 text-brand-700 flex h-8 w-8 items-center justify-center rounded-md">
            <ShieldCheck className="h-4 w-4" />
          </span>
          <div>
            <h2 className="text-ink-900 text-sm font-semibold">
              {enrollment || mfaEnrolled ? 'Two-factor verification' : 'Set up two-factor authentication'}
            </h2>
            <p className="text-ink-500 text-xs">
              {profile?.full_name || profile?.email} · Administrator
            </p>
          </div>
        </div>

        {error && <div className="mb-4"><Notice tone="error">{error}</Notice></div>}

        {!enrollment && !mfaEnrolled && (
          <>
            <div className="mb-4"><Notice tone="info">
              Administrator accounts must use an authenticator app (Google Authenticator, Authy, 1Password…) in addition
              to a password.
            </Notice></div>
            <ol className="text-ink-600 mb-4 list-decimal space-y-1.5 pl-5 text-xs leading-relaxed">
              <li>Install an authenticator app on your phone.</li>
              <li>Scan the QR code we show next.</li>
              <li>Enter the 6-digit code to finish setup.</li>
            </ol>
            <Button variant="primary" size="lg" block loading={busy} icon={<QrCode />} onClick={() => void beginEnrollment()}>
              Begin setup
            </Button>
          </>
        )}

        {enrollment && (
          <form onSubmit={submit} className="flex flex-col gap-4" noValidate>
            <div className="flex flex-col items-center gap-3">
              {/* Rendered large on purpose: the Supabase QR is dense (81 modules),
                  so a small box leaves each module ~2px and phone cameras can't
                  resolve it. 256px+ keeps the modules scannable. */}
              <img
                src={enrollment.qrCode}
                alt="Scan this QR code with your authenticator app"
                className="ring-ink-200 h-64 w-64 rounded-lg bg-white p-2 ring-1 sm:h-72 sm:w-72"
              />
              <div className="text-center">
                <p className="text-ink-500 text-[11px]">
                  Can't scan — for example if you're reading this on the same phone? Add this key in your authenticator
                  app manually:
                </p>
                <code className="text-ink-800 mt-1 inline-block rounded bg-ink-100 px-2 py-1 text-xs font-semibold tracking-wider break-all">
                  {enrollment.secret}
                </code>
              </div>
            </div>
            <Input
              label="6-digit code *"
              name="code"
              inputMode="numeric"
              autoComplete="one-time-code"
              maxLength={6}
              icon={<KeyRound />}
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
              placeholder="123456"
              autoFocus
              required
            />
            <Button type="submit" variant="primary" size="lg" block loading={busy} icon={<ShieldCheck />}>
              Verify and enable
            </Button>
            <Button type="button" variant="ghost" size="sm" block onClick={() => void cancelEnrollment()}>
              Cancel setup
            </Button>
          </form>
        )}

        {!enrollment && mfaEnrolled && (
          <form onSubmit={submit} className="flex flex-col gap-4" noValidate>
            <div className="mb-1"><Notice tone="info">
              <span className="inline-flex items-center gap-1.5">
                <Smartphone className="h-3.5 w-3.5" /> Open your authenticator app and enter the current code.
              </span>
            </Notice></div>
            <Input
              label="6-digit code *"
              name="code"
              inputMode="numeric"
              autoComplete="one-time-code"
              maxLength={6}
              icon={<KeyRound />}
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
              placeholder="123456"
              autoFocus
              required
            />
            <Button type="submit" variant="primary" size="lg" block loading={busy} icon={<ShieldCheck />}>
              Verify
            </Button>
          </form>
        )}

        <div className="border-ink-200 mt-4 border-t pt-4">
          <Button variant="ghost" size="sm" block icon={<LogOut />} onClick={() => void signOut()}>
            Sign out
          </Button>
        </div>
      </Card>
    </AuthFrame>
  );
}
