import type { ReactNode } from 'react';
import { Navigate, Route, Routes, useNavigate } from 'react-router-dom';
import { Home, LogOut } from 'lucide-react';
import { useAuth } from '@/auth/AuthProvider';
import { useAppStore, AppStoreProvider } from '@/store/AppStore';
import { isSupabaseConfigured } from '@/lib/supabase';
import { AppShell } from '@/components/layout/AppShell';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { LoadingState } from '@/components/ui/LoadingState';
import AuthPage, { SupabaseSetupPage } from '@/pages/AuthPage';
import MfaPage from '@/pages/MfaPage';
import AccountSetupPage from '@/pages/AccountSetupPage';
import DisabledPage from '@/pages/DisabledPage';

import DashboardPage from '@/pages/Dashboard';
import EmployersPage from '@/pages/Employers';
import EmployerDetailsPage from '@/pages/EmployerDetails';
import EmployerFilterPage from '@/pages/EmployerFilter';
import ComparePage from '@/pages/Compare';
import ShortlistPage from '@/pages/Shortlist';
import FeesPage from '@/pages/Fees';
import ContractsPage from '@/pages/Contracts';
import RequirementsPage from '@/pages/Requirements';
import DocumentsPage from '@/pages/Documents';
import NotificationsPage from '@/pages/Notifications';
import ReportsPage from '@/pages/Reports';
import SettingsPage from '@/pages/Settings';
import AdminDashboardPage from '@/pages/AdminDashboard';
import AdminStaffPage from '@/pages/AdminStaff';
import AdminActivityPage from '@/pages/AdminActivity';
import AdminSettingsPage from '@/pages/AdminSettings';

function NotFoundPage() {
  const navigate = useNavigate();
  return (
    <Card>
      <EmptyState
        variant="error"
        title="Page not found"
        description="That route does not exist. Use the navigation to get back on track."
        action={
          <Button variant="primary" icon={<Home />} onClick={() => navigate('/dashboard')}>
            Go to dashboard
          </Button>
        }
      />
    </Card>
  );
}

/** Sends `/` to whichever page the user nominated as their landing page. */
function LandingRedirect() {
  const { settings } = useAppStore();
  return <Navigate to={settings.landingPage || '/dashboard'} replace />;
}

/**
 * Route guard for the Admin section.
 *
 * The app-level gate has already guaranteed a valid session and, for admins,
 * a completed MFA challenge. This adds the role check so a staff member who
 * types an `/admin/*` URL is redirected — and the database/Edge Function
 * enforce the same rule independently of the UI.
 */
function RequireAdmin({ children }: { children: ReactNode }) {
  const { isAdmin } = useAuth();
  if (!isAdmin) return <Navigate to="/dashboard" replace />;
  return <>{children}</>;
}

/** Shown while a session exists but the profile row has not resolved yet. */
function SessionLoading() {
  const { signOut } = useAuth();
  return (
    <div className="bg-ink-100 flex min-h-screen flex-col items-center justify-center gap-4">
      <LoadingState label="Preparing your workspace…" />
      <Button variant="ghost" size="sm" icon={<LogOut />} onClick={() => void signOut()}>
        Sign out
      </Button>
    </div>
  );
}

function AuthenticatedApp() {
  return (
    <AppStoreProvider>
      <Routes>
        <Route element={<AppShell />}>
          <Route path="/" element={<LandingRedirect />} />
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/employers" element={<EmployersPage />} />
          <Route path="/employers/:employerId" element={<EmployerDetailsPage />} />
          <Route path="/filter" element={<EmployerFilterPage />} />
          <Route path="/compare" element={<ComparePage />} />
          <Route path="/shortlist" element={<ShortlistPage />} />
          <Route path="/fees" element={<FeesPage />} />
          <Route path="/contracts" element={<ContractsPage />} />
          <Route path="/requirements" element={<RequirementsPage />} />
          <Route path="/documents" element={<DocumentsPage />} />
          <Route path="/notifications" element={<NotificationsPage />} />
          <Route path="/reports" element={<ReportsPage />} />
          <Route path="/settings" element={<SettingsPage />} />

          {/* Admin section — role-guarded, MFA enforced by the gate above. */}
          <Route path="/admin" element={<Navigate to="/admin/dashboard" replace />} />
          <Route
            path="/admin/dashboard"
            element={
              <RequireAdmin>
                <AdminDashboardPage />
              </RequireAdmin>
            }
          />
          <Route
            path="/admin/staff"
            element={
              <RequireAdmin>
                <AdminStaffPage />
              </RequireAdmin>
            }
          />
          <Route
            path="/admin/activity"
            element={
              <RequireAdmin>
                <AdminActivityPage />
              </RequireAdmin>
            }
          />
          <Route
            path="/admin/settings"
            element={
              <RequireAdmin>
                <AdminSettingsPage />
              </RequireAdmin>
            }
          />

          <Route path="*" element={<NotFoundPage />} />
        </Route>
      </Routes>
    </AppStoreProvider>
  );
}

export default function AppRoutes() {
  const { loading, session, profile, recoveryMode, isDisabled, mustSetPassword, mfaPending } = useAuth();

  if (!isSupabaseConfigured) return <SupabaseSetupPage />;

  if (loading) {
    return (
      <div className="bg-ink-100 flex min-h-screen items-center justify-center">
        <LoadingState label="Checking your session…" />
      </div>
    );
  }

  /* No session (or a password-recovery link that still needs a new password):
     the only thing an unauthenticated visitor sees is the sign-in screen. */
  if (!session || recoveryMode) return <AuthPage />;

  /* A session exists but its profile has not resolved — never render the app
     on a session we cannot yet authorise. */
  if (!profile) return <SessionLoading />;

  /* Order matters: a disabled account is blocked outright; an invited account
     must finish setup; an administrator must complete MFA. */
  if (isDisabled) return <DisabledPage />;
  if (mustSetPassword) return <AccountSetupPage />;
  if (mfaPending) return <MfaPage />;

  return <AuthenticatedApp />;
}
