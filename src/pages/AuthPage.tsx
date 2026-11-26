import { useEffect, useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { AlertCircle, ArrowLeft, KeyRound, LogIn, Mail } from 'lucide-react';
import { useAuth } from '@/auth/AuthProvider';
import { AuthFrame, Notice } from '@/components/auth/AuthFrame';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { emailProblem, passwordProblem } from '@/lib/security';

type Mode = 'signin' | 'forgot' | 'reset';

/**
 * Minimum gap between recovery emails for the same address.
 *
 * Supabase Auth enforces its own 60-second `max_frequency` per address plus a
 * project-wide hourly quota (`email_sent`). Holding the button for the same
 * minute stops a user who has not seen the email yet from spending that quota
 * on repeated clicks. The mark is persisted so a page refresh does not reset it.
 */
const RESET_COOLDOWN_MS = 60_000;
const RESET_MARK_KEY = 'efms.resetLink.sentAt';

interface ResetMark {
  email: string;
  at: number;
}

function readResetMark(): ResetMark | null {
  try {
    const raw = window.localStorage.getItem(RESET_MARK_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<ResetMark>;
    if (typeof parsed.email !== 'string' || typeof parsed.at !== 'number') return null;
    return parsed.at + RESET_COOLDOWN_MS > Date.now() ? { email: parsed.email, at: parsed.at } : null;
  } catch {
    return null;
  }
}

function writeResetMark(mark: ResetMark | null) {
  try {
    if (mark) window.localStorage.setItem(RESET_MARK_KEY, JSON.stringify(mark));
    else window.localStorage.removeItem(RESET_MARK_KEY);
  } catch {
    /* Private mode / storage disabled — the in-memory timer still applies. */
  }
}

/**
 * Sign-in screen.
 *
 * There is deliberately no "Create account" tab: EFMS has no public staff
 * registration. Administrators invite staff from the Admin → Staff Management
 * screen, and the invitee activates their account from the email link.
 */
export default function AuthPage() {
  const {
    signIn,
    requestPasswordReset,
    updatePassword,
    acceptInvitation,
    recoveryMode,
    clearRecovery,
    linkError,
    clearLinkError,
  } = useAuth();
  const [mode, setMode] = useState<Mode>('signin');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');

  const [resetMark, setResetMark] = useState<ResetMark | null>(() => readResetMark());
  const [now, setNow] = useState(() => Date.now());

  const activeMode: Mode = recoveryMode ? 'reset' : mode;

  /* Tick the resend countdown once a second, and drop the mark when it lapses. */
  useEffect(() => {
    if (!resetMark) return;
    const id = window.setInterval(() => {
      if (Date.now() - resetMark.at >= RESET_COOLDOWN_MS) {
        writeResetMark(null);
        setResetMark(null);
      } else {
        setNow(Date.now());
      }
    }, 1000);
    return () => window.clearInterval(id);
  }, [resetMark]);

  const remainingSeconds = resetMark
    ? Math.max(0, Math.ceil((resetMark.at + RESET_COOLDOWN_MS - now) / 1000))
    : 0;
  /* The cooldown is per address, so correcting a typo is never blocked. */
  const cooling = Boolean(
    resetMark && resetMark.email === email.trim().toLowerCase() && remainingSeconds > 0,
  );

  const startCooldown = (address: string) => {
    const mark: ResetMark = { email: address.trim().toLowerCase(), at: Date.now() };
    writeResetMark(mark);
    setResetMark(mark);
    setNow(mark.at);
  };

  const switchMode = (next: Mode) => {
    setMode(next);
    setError(null);
    setNotice(null);
    setPassword('');
    setConfirm('');
    clearLinkError();
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    /* Guard the form's Enter key as well as the button: a second submit while
       the first is in flight would send a second email. */
    if (busy || cooling) return;
    setError(null);
    setNotice(null);
    /* Acting on the form supersedes the notice about the link that failed. */
    clearLinkError();

    if (activeMode === 'reset' && password !== confirm) {
      setError('The two passwords do not match.');
      return;
    }
    if (activeMode === 'reset') {
      const problem = passwordProblem(password);
      if (problem) {
        setError(problem);
        return;
      }
    }
    if (activeMode !== 'reset') {
      const problem = emailProblem(email);
      if (problem) {
        setError(problem);
        return;
      }
    }

    setBusy(true);
    try {
      if (activeMode === 'signin') {
        const result = await signIn(email, password);
        if (result.error) setError(result.error);
        /* On success the app-level gate takes over: admins are routed to the
           MFA step, everyone else lands in their dashboard. */
      } else if (activeMode === 'forgot') {
        const result = await requestPasswordReset(email);
        if (result.outcome === 'sent') {
          startCooldown(email);
          setNotice(
            `If an account exists for ${email.trim()}, a reset link is on its way. ` +
              'It can take a minute to arrive — check your spam folder before requesting another.',
          );
        } else {
          /* A rate-limited request already used up the quota; hold the button
             so the next attempt does not land on the same 429. */
          if (result.outcome === 'rate-limited') startCooldown(email);
          if (result.error) setError(result.error);
        }
      } else {
        const result = await updatePassword(password);
        if (result.error) {
          setError(result.error);
        } else {
          /* If an invited staff member is activating via their email link, this
             promotes them invited → active (it is a no-op for anyone else). */
          await acceptInvitation();
          clearRecovery();
          setNotice('Your password has been set. Welcome to EFMS.');
          setMode('signin');
        }
      }
    } finally {
      setBusy(false);
    }
  };

  return (
    <AuthFrame>
      {activeMode !== 'reset' && (
        <Link
          to="/"
          onClick={() => clearLinkError()}
          className="text-ink-500 hover:text-ink-800 mb-3 inline-flex items-center gap-1 text-xs font-medium"
        >
          <ArrowLeft className="h-3.5 w-3.5" aria-hidden /> Back to overview
        </Link>
      )}
      <Card className="p-5 sm:p-6">
        {activeMode === 'reset' && (
          <div className="mb-4 flex items-center gap-2">
            <span className="bg-brand-50 text-brand-700 flex h-8 w-8 items-center justify-center rounded-md">
              <KeyRound className="h-4 w-4" />
            </span>
            <div>
              <h2 className="text-ink-900 text-sm font-semibold">Set a new password</h2>
              <p className="text-ink-500 text-xs">Choose a password you have not used before.</p>
            </div>
          </div>
        )}

        {activeMode === 'forgot' && (
          <div className="mb-4">
            <button
              type="button"
              onClick={() => switchMode('signin')}
              className="text-ink-500 hover:text-ink-800 inline-flex items-center gap-1 text-xs font-medium"
            >
              <ArrowLeft className="h-3.5 w-3.5" /> Back to sign in
            </button>
            <h2 className="text-ink-900 mt-3 text-sm font-semibold">Reset your password</h2>
            <p className="text-ink-500 mt-0.5 text-xs">
              Enter your work email and we will send you a secure reset link.
            </p>
          </div>
        )}

        {activeMode === 'signin' && (
          <div className="mb-4">
            <h2 className="text-ink-900 text-sm font-semibold">Sign in</h2>
            <p className="text-ink-500 mt-0.5 text-xs">
              Use your work email and password. Administrators also complete a verification code.
            </p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-3.5" noValidate>
          {linkError && <Notice tone="error">{linkError.message}</Notice>}
          {error && <Notice tone="error">{error}</Notice>}
          {notice && <Notice tone="success">{notice}</Notice>}

          {activeMode !== 'reset' && (
            <Input
              label="Work email *"
              name="email"
              type="email"
              icon={<Mail />}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@levelup.example"
              autoComplete="email"
              required
            />
          )}

          {activeMode !== 'forgot' && (
            <Input
              label={activeMode === 'reset' ? 'New password *' : 'Password *'}
              name="password"
              type="password"
              icon={<KeyRound />}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              autoComplete={activeMode === 'signin' ? 'current-password' : 'new-password'}
              required
            />
          )}

          {activeMode === 'reset' && (
            <Input
              label="Confirm password *"
              name="confirm"
              type="password"
              icon={<KeyRound />}
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              placeholder="••••••••"
              autoComplete="new-password"
              required
            />
          )}

          {activeMode === 'signin' && (
            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => switchMode('forgot')}
                className="text-brand-700 hover:text-brand-800 text-xs font-medium"
              >
                Forgot password?
              </button>
            </div>
          )}

          <Button
            type="submit"
            variant="primary"
            size="lg"
            block
            loading={busy}
            disabled={cooling}
            icon={activeMode === 'forgot' ? <Mail /> : <LogIn />}
          >
            {activeMode === 'signin'
              ? 'Sign in'
              : activeMode === 'forgot'
                ? busy
                  ? 'Sending reset link…'
                  : cooling
                    ? `Resend in ${remainingSeconds}s`
                    : 'Send reset link'
                : 'Update password'}
          </Button>

          {activeMode === 'forgot' && cooling && (
            <p className="text-ink-500 text-center text-[11px] leading-relaxed">
              One reset email per minute. Check your inbox and spam folder before requesting another.
            </p>
          )}
        </form>

        {activeMode === 'signin' && (
          <div className="mt-4">
            <Notice tone="info">
              Staff accounts are created by an administrator. If you were invited, open the invitation email to set your
              password.
            </Notice>
          </div>
        )}
      </Card>
    </AuthFrame>
  );
}

/** Shown when `.env.local` has no Supabase credentials yet. */
export function SupabaseSetupPage() {
  return (
    <AuthFrame>
      <Card className="p-5 sm:p-6">
        <div className="flex items-center gap-2">
          <span className="bg-amber-50 text-amber-700 flex h-8 w-8 items-center justify-center rounded-md">
            <AlertCircle className="h-4 w-4" />
          </span>
          <h2 className="text-ink-900 text-sm font-semibold">Connect your Supabase project</h2>
        </div>
        <ol className="text-ink-600 mt-4 list-decimal space-y-2 pl-5 text-xs leading-relaxed">
          <li>
            Create a project at <span className="text-ink-900 font-medium">supabase.com</span>.
          </li>
          <li>
            Run <code className="bg-ink-100 rounded px-1">supabase/migrations/0001_init.sql</code>, then{' '}
            <code className="bg-ink-100 rounded px-1">0002_auth_hardening.sql</code>, then{' '}
            <code className="bg-ink-100 rounded px-1">supabase/seed.sql</code> in the SQL Editor.
          </li>
          <li>
            Copy <code className="bg-ink-100 rounded px-1">.env.example</code> to{' '}
            <code className="bg-ink-100 rounded px-1">.env.local</code> and paste your Project URL and anon key.
          </li>
          <li>Restart the dev server.</li>
        </ol>
      </Card>
    </AuthFrame>
  );
}
