import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import type { Factor, Session, User } from '@supabase/supabase-js';
import { describeError, supabase } from '@/lib/supabase';
import type { ProfileRow, ProfileStatus } from '@/lib/database.types';

export type AppRole = 'admin' | 'staff';

/** TOTP enrollment payload handed to the UI (QR + manual secret). */
export interface MfaEnrollment {
  factorId: string;
  qrCode: string;
  secret: string;
  uri: string;
}

interface MfaState {
  /** The assurance level the current session actually has. */
  currentLevel: 'aal1' | 'aal2' | null;
  /** The level the session could reach (aal2 when a verified factor exists). */
  nextLevel: 'aal1' | 'aal2' | null;
  /** True when the user has at least one verified TOTP factor. */
  enrolled: boolean;
  /** The id of the verified TOTP factor, needed to issue a login challenge. */
  factorId: string | null;
}

const EMPTY_MFA: MfaState = { currentLevel: null, nextLevel: null, enrolled: false, factorId: null };

export interface AuthContextValue {
  /** True while the initial session is being restored. */
  loading: boolean;
  session: Session | null;
  user: User | null;
  profile: ProfileRow | null;
  role: AppRole | null;
  isAdmin: boolean;
  accountStatus: ProfileStatus | null;
  isDisabled: boolean;
  /** Invited staff who still have to choose a password. */
  mustSetPassword: boolean;
  /** True when the user arrived via a password-recovery link. */
  recoveryMode: boolean;

  /* --- MFA (TOTP) — mandatory for administrators ------------------------ */
  /** Admins must satisfy MFA before the app renders. */
  mfaRequired: boolean;
  /** A verified TOTP factor exists. */
  mfaEnrolled: boolean;
  /** The verified TOTP factor id, for issuing the login challenge. */
  mfaFactorId: string | null;
  /** The session reached AAL2 (MFA completed). */
  mfaVerified: boolean;
  /** An admin session that still has to enrol or challenge. */
  mfaPending: boolean;

  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
  requestPasswordReset: (email: string) => Promise<{ error: string | null }>;
  updatePassword: (password: string) => Promise<{ error: string | null }>;
  /** Promotes the caller invited → active after they set a password. */
  acceptInvitation: () => Promise<{ error: string | null }>;

  enrollMfa: () => Promise<{ data: MfaEnrollment | null; error: string | null }>;
  verifyMfa: (factorId: string, code: string) => Promise<{ error: string | null }>;
  unenrollMfa: (factorId: string) => Promise<{ error: string | null }>;
  refreshMfa: () => Promise<void>;

  refreshProfile: () => Promise<void>;
  clearRecovery: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<ProfileRow | null>(null);
  const [loading, setLoading] = useState(true);
  const [recoveryMode, setRecoveryMode] = useState(false);
  const [mfa, setMfa] = useState<MfaState>(EMPTY_MFA);
  const mounted = useRef(true);

  const user = session?.user ?? null;

  /** Loads the caller's profile row, retrying briefly for signup trigger lag. */
  const loadProfile = useCallback(async (userId: string): Promise<ProfileRow | null> => {
    for (let attempt = 0; attempt < 4; attempt += 1) {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle<ProfileRow>();
      if (data) return data;
      if (error && !/no rows|multiple/i.test(error.message)) {
        // Real error (e.g. offline) — stop retrying.
        return null;
      }
      await new Promise((resolve) => setTimeout(resolve, 350 * (attempt + 1)));
    }
    return null;
  }, []);

  /** Reads the session's assurance level and enrolled TOTP factors. */
  const loadMfa = useCallback(async (hasSession: boolean) => {
    if (!hasSession) {
      setMfa(EMPTY_MFA);
      return;
    }
    try {
      const [{ data: level }, { data: factors }] = await Promise.all([
        supabase.auth.mfa.getAuthenticatorAssuranceLevel(),
        supabase.auth.mfa.listFactors(),
      ]);
      const totp = (factors?.totp ?? []) as Factor[];
      const verified = totp.find((factor) => factor.status === 'verified') ?? null;
      setMfa({
        currentLevel: (level?.currentLevel as 'aal1' | 'aal2' | null) ?? null,
        nextLevel: (level?.nextLevel as 'aal1' | 'aal2' | null) ?? null,
        enrolled: Boolean(verified),
        factorId: verified?.id ?? null,
      });
    } catch {
      /* MFA may be unavailable (e.g. not enabled on the project). Fail closed:
         an admin will simply be asked to enrol again. */
      setMfa(EMPTY_MFA);
    }
  }, []);

  const refreshProfile = useCallback(async () => {
    if (!user) {
      setProfile(null);
      return;
    }
    setProfile(await loadProfile(user.id));
  }, [user, loadProfile]);

  const refreshMfa = useCallback(async () => {
    await loadMfa(Boolean(session?.user));
  }, [loadMfa, session]);

  /* Restore the persisted session once, then track auth changes. */
  useEffect(() => {
    mounted.current = true;

    supabase.auth.getSession().then(async ({ data }) => {
      if (!mounted.current) return;
      setSession(data.session);
      if (data.session?.user) {
        setProfile(await loadProfile(data.session.user.id));
        await loadMfa(true);
      }
      if (mounted.current) setLoading(false);
    });

    const { data: subscription } = supabase.auth.onAuthStateChange((event, nextSession) => {
      if (!mounted.current) return;
      if (event === 'PASSWORD_RECOVERY') setRecoveryMode(true);
      setSession(nextSession);
      if (nextSession?.user) {
        /* Deferred: Supabase advises against awaiting other client calls
           directly inside this callback, as it holds the auth lock. */
        const userId = nextSession.user.id;
        setTimeout(() => {
          void loadProfile(userId).then((next) => {
            if (mounted.current) setProfile(next);
          });
          void loadMfa(true);
        }, 0);
      } else {
        setProfile(null);
        void loadMfa(false);
      }
    });

    return () => {
      mounted.current = false;
      subscription.subscription.unsubscribe();
    };
  }, [loadProfile, loadMfa]);

  const signIn = useCallback<AuthContextValue['signIn']>(
    async (email, password) => {
      const { data, error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
      if (error) {
        if (/invalid login credentials/i.test(error.message)) {
          return { error: 'Incorrect email or password.' };
        }
        if (/banned|disabled/i.test(error.message)) {
          return { error: 'This account has been disabled. Contact an administrator.' };
        }
        if (/email not confirmed/i.test(error.message)) {
          return { error: 'Please confirm your email address before signing in.' };
        }
        return { error: describeError(error) };
      }

      /* Supabase Auth accepts the password of a disabled account, so the
         account status must be checked here and the session torn down. */
      if (data.user) {
        const next = await loadProfile(data.user.id);
        if (next?.status === 'disabled') {
          await supabase.auth.signOut();
          return { error: 'This account has been disabled. Contact an administrator.' };
        }
      }
      return { error: null };
    },
    [loadProfile],
  );

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
    setProfile(null);
    setSession(null);
    setRecoveryMode(false);
    setMfa(EMPTY_MFA);
  }, []);

  const requestPasswordReset = useCallback<AuthContextValue['requestPasswordReset']>(async (email) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: window.location.origin,
    });
    return { error: error ? describeError(error) : null };
  }, []);

  const updatePassword = useCallback<AuthContextValue['updatePassword']>(async (password) => {
    const { error } = await supabase.auth.updateUser({ password });
    return { error: error ? describeError(error) : null };
  }, []);

  const acceptInvitation = useCallback<AuthContextValue['acceptInvitation']>(async () => {
    const { error } = await supabase.rpc('accept_invitation');
    if (error) return { error: describeError(error) };
    if (user) setProfile(await loadProfile(user.id));
    return { error: null };
  }, [user, loadProfile]);

  const enrollMfa = useCallback<AuthContextValue['enrollMfa']>(async () => {
    const { data, error } = await supabase.auth.mfa.enroll({
      factorType: 'totp',
      friendlyName: `EFMS Admin · ${new Date().toISOString().slice(0, 10)}`,
    });
    if (error || !data) {
      const raw = error?.message ?? '';
      if (/not enabled|disabled|unsupported|not available|not supported/i.test(raw)) {
        return {
          data: null,
          error:
            'Two-factor authentication is not enabled for this Supabase project. Enable TOTP MFA in the Supabase dashboard (Authentication → Multi-Factor Auth), then try again.',
        };
      }
      return { data: null, error: error ? describeError(error) : 'Enrollment failed.' };
    }
    return {
      data: {
        factorId: data.id,
        qrCode: data.totp.qr_code,
        secret: data.totp.secret,
        uri: data.totp.uri,
      },
      error: null,
    };
  }, []);

  const verifyMfa = useCallback<AuthContextValue['verifyMfa']>(
    async (factorId, code) => {
      const { data: challenge, error: challengeError } = await supabase.auth.mfa.challenge({ factorId });
      if (challengeError || !challenge) {
        return { error: describeError(challengeError) };
      }
      const { error } = await supabase.auth.mfa.verify({
        factorId,
        challengeId: challenge.id,
        code: code.trim(),
      });
      if (error) {
        if (/invalid|incorrect|expired|too many/i.test(error.message)) {
          return { error: 'That code is not valid. Check your authenticator app and try again.' };
        }
        return { error: describeError(error) };
      }
      await loadMfa(true);
      return { error: null };
    },
    [loadMfa],
  );

  const unenrollMfa = useCallback<AuthContextValue['unenrollMfa']>(
    async (factorId) => {
      const { error } = await supabase.auth.mfa.unenroll({ factorId });
      if (error) return { error: describeError(error) };
      /* Unenrolling only downgrades the session after a token refresh, so force
         one now — otherwise the app could briefly still read the old aal2. */
      await supabase.auth.refreshSession();
      await loadMfa(true);
      return { error: null };
    },
    [loadMfa],
  );

  const clearRecovery = useCallback(() => setRecoveryMode(false), []);

  const role = profile?.role ?? null;
  const isAdmin = role === 'admin';
  const accountStatus = profile?.status ?? null;
  const mfaRequired = isAdmin;
  const mfaVerified = mfa.currentLevel === 'aal2';
  /* An admin must satisfy MFA before the app renders. They are "pending" when
     they have no verified factor yet (must enrol) OR the session has not
     reached AAL2 (must challenge). Checking the enrolled flag too protects
     against a stale `aal2` token immediately after an unenroll. */
  const mfaPending = Boolean(session?.user) && mfaRequired && !(mfa.enrolled && mfaVerified);

  const value = useMemo<AuthContextValue>(
    () => ({
      loading,
      session,
      user,
      profile,
      role,
      isAdmin,
      accountStatus,
      isDisabled: accountStatus === 'disabled',
      mustSetPassword: accountStatus === 'invited',
      recoveryMode,
      mfaRequired,
      mfaEnrolled: mfa.enrolled,
      mfaFactorId: mfa.factorId,
      mfaVerified,
      mfaPending,
      signIn,
      signOut,
      requestPasswordReset,
      updatePassword,
      acceptInvitation,
      enrollMfa,
      verifyMfa,
      unenrollMfa,
      refreshMfa,
      refreshProfile,
      clearRecovery,
    }),
    [
      loading,
      session,
      user,
      profile,
      role,
      isAdmin,
      accountStatus,
      recoveryMode,
      mfaRequired,
      mfa.enrolled,
      mfa.factorId,
      mfaVerified,
      mfaPending,
      signIn,
      signOut,
      requestPasswordReset,
      updatePassword,
      acceptInvitation,
      enrollMfa,
      verifyMfa,
      unenrollMfa,
      refreshMfa,
      refreshProfile,
      clearRecovery,
    ],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used inside <AuthProvider>.');
  return context;
}
