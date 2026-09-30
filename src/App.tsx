import { Navigate, Route, Routes, useNavigate } from 'react-router-dom';
import { Home } from 'lucide-react';
import { useAppStore } from '@/store/AppStore';
import { AppShell } from '@/components/layout/AppShell';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';

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

function NotFoundPage() {
  const navigate = useNavigate();
  return (
    <Card>
      <EmptyState
        variant="error"
        title="Page not found"
        description="That route does not exist in this prototype. Use the navigation to get back on track."
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

export default function AppRoutes() {
  return (
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
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  );
}
