import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  BellRing,
  Check,
  Database,
  Download,
  LayoutGrid,
  Moon,
  Palette,
  RefreshCw,
  SlidersHorizontal,
  Sun,
  Table2,
  Trash2,
  UserCog,
} from 'lucide-react';
import type { AccentKey } from '@/lib/theme';
import { ACCENT_THEMES } from '@/lib/theme';
import { COUNTRIES, EMPLOYER_STATUSES, NOTIFICATION_CATEGORIES } from '@/lib/constants';
import { downloadFile, formatNumber } from '@/lib/utils';
import { DEFAULT_EMPLOYER_COLUMNS, DEFAULT_SETTINGS, useAppStore } from '@/store/AppStore';
import { isSupabaseConfigured } from '@/lib/supabase';
import { useAuth } from '@/auth/AuthProvider';
import { useConfirmDialog } from '@/hooks/useConfirmDialog';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card, CardHeader } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Checkbox, Segmented, Switch } from '@/components/ui/Checkbox';
import { Select } from '@/components/ui/Select';
import { cn } from '@/lib/utils';

const LANDING_PAGES = [
  { value: '/dashboard', label: 'Dashboard' },
  { value: '/employers', label: 'Employer database' },
  { value: '/filter', label: 'Employer filtering' },
  { value: '/shortlist', label: 'Shortlist' },
  { value: '/reports', label: 'Reports' },
];

/**
 * Settings.
 *
 * Appearance and display preferences are stored per user in the `app_settings`
 * table and applied to the document root, so they take effect immediately and
 * follow the signed-in user across devices.
 */
export default function SettingsPage() {
  const {
    settings,
    updateSettings,
    resetDemoData,
    records,
    employers,
    jobs,
    contracts,
    fees,
    requirements,
    documents,
    notes,
    shortlist,
    presets,
    notifications,
    activity,
    toast,
  } = useAppStore();
  const { isAdmin, profile } = useAuth();
  const { confirm, dialog } = useConfirmDialog();
  const navigate = useNavigate();
  const [reloading, setReloading] = useState(false);

  const handleExportJson = () => {
    const payload = {
      exportedAt: new Date().toISOString(),
      note: 'EFMS data export.',
      settings,
      employers,
      jobs,
      contracts,
      fees,
      requirements,
      documents,
      notes,
      shortlist,
      presets,
      notifications,
      activity,
    };
    downloadFile('efms-data.json', JSON.stringify(payload, null, 2), 'application/json');
    toast({ title: 'Data exported', description: 'A JSON snapshot was downloaded.', variant: 'success' });
  };

  const handleReload = async () => {
    setReloading(true);
    resetDemoData();
    setReloading(false);
  };

  return (
    <>
      <PageHeader
        title="Settings"
        description="Appearance, display density, currency formatting and team access. Preferences are saved to your account."
      />

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        {/* Appearance ------------------------------------------------- */}
        <Card>
          <CardHeader
            title="Appearance"
            description="Applies instantly to the whole application."
            icon={<Palette />}
          />

          <div className="flex flex-col gap-5">
            <div>
              <p className="text-ink-700 mb-2 text-xs font-medium">Colour mode</p>
              <Segmented
                ariaLabel="Colour mode"
                value={settings.theme}
                onChange={(value) => {
                  updateSettings({ theme: value });
                  toast({
                    title: value === 'dark' ? 'Dark mode enabled' : 'Light mode enabled',
                    variant: 'info',
                  });
                }}
                options={[
                  { value: 'light', label: 'Light', icon: <Sun /> },
                  { value: 'dark', label: 'Dark', icon: <Moon /> },
                ]}
              />
              <p className="text-ink-500 mt-2 text-[11px] leading-relaxed">
                Dark mode inverts the neutral ramp and rebuilds the accent palette for a dark canvas.
              </p>
            </div>

            <div>
              <p className="text-ink-700 mb-2 text-xs font-medium">Accent colour</p>
              <div className="flex flex-wrap gap-2">
                {ACCENT_THEMES.map((theme) => {
                  const active = settings.accent === theme.key;
                  return (
                    <button
                      key={theme.key}
                      type="button"
                      onClick={() => updateSettings({ accent: theme.key as AccentKey })}
                      aria-pressed={active}
                      title={theme.description}
                      className={cn(
                        'flex items-center gap-2 rounded-lg border px-2.5 py-1.5 text-[12px] font-medium transition-colors',
                        active
                          ? 'border-brand-300 bg-brand-50 text-brand-700'
                          : 'border-ink-300 text-ink-600 hover:border-ink-400 hover:bg-ink-50',
                      )}
                    >
                      <span className="flex gap-0.5" aria-hidden>
                        {[300, 500, 700].map((step) => (
                          <span
                            key={step}
                            className="h-3.5 w-3.5 rounded-sm"
                            style={{ backgroundColor: theme.scale[step as 300 | 500 | 700] }}
                          />
                        ))}
                      </span>
                      {theme.label}
                      {active && <Check className="h-3.5 w-3.5" />}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </Card>

        {/* Display ---------------------------------------------------- */}
        <Card>
          <CardHeader
            title="Display"
            description="How employer records are presented by default."
            icon={<LayoutGrid />}
          />

          <div className="flex flex-col gap-5">
            <div>
              <p className="text-ink-700 mb-2 text-xs font-medium">Default employer view</p>
              <Segmented
                ariaLabel="Default employer view"
                value={settings.viewMode}
                onChange={(value) => updateSettings({ viewMode: value })}
                options={[
                  { value: 'table', label: 'Table', icon: <Table2 /> },
                  { value: 'card', label: 'Cards', icon: <LayoutGrid /> },
                ]}
              />
            </div>

            <div>
              <p className="text-ink-700 mb-2 text-xs font-medium">Row density</p>
              <Segmented
                ariaLabel="Row density"
                value={settings.density}
                onChange={(value) => updateSettings({ density: value })}
                options={[
                  { value: 'comfortable', label: 'Comfortable' },
                  { value: 'compact', label: 'Compact' },
                ]}
              />
            </div>

            <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
              <Select
                label="Rows per page"
                name="rowsPerPage"
                options={[10, 15, 25, 50, 100].map((value) => ({ value, label: `${value} rows` }))}
                value={settings.rowsPerPage}
                onChange={(event) => updateSettings({ rowsPerPage: Number(event.target.value) })}
              />
              <Select
                label="Salary display"
                name="currencyDisplay"
                options={[
                  { value: 'php', label: 'PHP only' },
                  { value: 'local', label: 'Local currency only' },
                  { value: 'both', label: 'PHP + local currency' },
                ]}
                value={settings.currencyDisplay}
                onChange={(event) =>
                  updateSettings({ currencyDisplay: event.target.value as typeof settings.currencyDisplay })
                }
              />
              <Select
                label="Landing page"
                name="landingPage"
                options={LANDING_PAGES}
                value={settings.landingPage}
                onChange={(event) => updateSettings({ landingPage: event.target.value })}
                containerClassName="sm:col-span-2"
              />
            </div>

            <div className="border-ink-200 border-t pt-4">
              <Switch
                label="Show archived employers"
                description="Archived employers are hidden from the employer database and from filtering results by default."
                checked={settings.showArchived}
                onChange={(event) => updateSettings({ showArchived: event.target.checked })}
              />
            </div>
          </div>
        </Card>

        {/* Preferences ------------------------------------------------ */}
        <Card>
          <CardHeader
            title="Filtering preferences"
            description="Applied when the filtering workspace is opened without a saved filter."
            icon={<SlidersHorizontal />}
          />

          <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
            <Select
              label="Default country"
              name="defaultCountry"
              placeholder="No default"
              options={COUNTRIES.map((country) => ({ value: country.value, label: country.label }))}
              value={settings.defaultCountry}
              onChange={(event) => updateSettings({ defaultCountry: event.target.value })}
            />
            <Select
              label="Default employer status"
              name="defaultEmployerStatus"
              placeholder="No default"
              options={EMPLOYER_STATUSES.map((value) => ({ value, label: value }))}
              value={settings.defaultEmployerStatus}
              onChange={(event) => updateSettings({ defaultEmployerStatus: event.target.value })}
            />
          </div>

          <div className="border-ink-200 mt-4 border-t pt-4">
            <p className="text-ink-700 mb-2.5 text-xs font-medium">Employer table columns</p>
            <div className="grid grid-cols-1 gap-1.5 sm:grid-cols-2">
              {DEFAULT_EMPLOYER_COLUMNS.map((column) => (
                <Checkbox
                  key={column}
                  label={column.replace(/([A-Z])/g, ' $1').replace(/^./, (char) => char.toUpperCase())}
                  checked
                  disabled
                  onChange={() => undefined}
                />
              ))}
            </div>
            <p className="text-ink-500 mt-2 text-[11px]">
              Column visibility is configured from the employer database toolbar. These are the shipped defaults.
            </p>
          </div>
        </Card>

        {/* Notifications ---------------------------------------------- */}
        <Card>
          <CardHeader
            title="Alert preferences"
            description="Which notification categories appear in the notification centre."
            icon={<BellRing />}
          />

          <div className="flex flex-col gap-3">
            {NOTIFICATION_CATEGORIES.map((category) => (
              <Switch
                key={category}
                label={`${category} alerts`}
                description={
                  category === 'Contract'
                    ? 'Contract expiry and renewal reminders.'
                    : category === 'Document'
                      ? 'Documents awaiting review, rejected or expired.'
                      : category === 'Verification'
                        ? 'Employer verification workflow updates.'
                        : category === 'Fee'
                          ? 'Fee changes and overdue payments.'
                          : category === 'Requirement'
                            ? 'Missing mandatory documentation.'
                            : category === 'Employer'
                              ? 'New employer registrations.'
                              : 'System and report notifications.'
                }
                checked={settings.notificationPrefs[category] !== false}
                onChange={(event) =>
                  updateSettings({
                    notificationPrefs: { ...settings.notificationPrefs, [category]: event.target.checked },
                  })
                }
              />
            ))}
          </div>
        </Card>

        {/* Data ------------------------------------------------------- */}
        <Card className="xl:col-span-2">
          <CardHeader
            title="Data"
            description="All records are stored in your Supabase Postgres database and shared across the team."
            icon={<Database />}
          />

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[
              { label: 'Employers', value: employers.length },
              { label: 'Job orders', value: jobs.length },
              { label: 'Contracts', value: contracts.length },
              { label: 'Fee lines', value: fees.length },
              { label: 'Requirement items', value: requirements.length },
              { label: 'Documents', value: documents.length },
              { label: 'Notifications', value: notifications.length },
              { label: 'Activity entries', value: activity.length },
            ].map((item) => (
              <div key={item.label} className="bg-ink-50 rounded-lg px-3 py-2.5">
                <p className="text-ink-500 text-[10px] font-semibold tracking-wide uppercase">{item.label}</p>
                <p className="text-ink-900 tnum mt-1 text-sm font-semibold">{formatNumber(item.value)}</p>
              </div>
            ))}
          </div>

          <div className="border-ink-200 mt-4 flex flex-wrap items-center gap-2 border-t pt-4">
            <Badge tone={isSupabaseConfigured ? 'success' : 'danger'} size="md">
              {isSupabaseConfigured ? 'Connected to Supabase' : 'Supabase not configured'}
            </Badge>
            <Badge tone="neutral" size="md">
              {records.length} employer records derived
            </Badge>
            <Badge tone="brand" size="md">
              Accent: {settings.accent}
            </Badge>
            {profile && (
              <Badge tone="neutral" size="md">
                Signed in as {profile.full_name || profile.email} ({profile.role})
              </Badge>
            )}
          </div>

          <div className="border-ink-200 mt-4 flex flex-wrap items-center gap-2 border-t pt-4">
            <Button variant="outline" icon={<Download />} onClick={handleExportJson}>
              Export data (JSON)
            </Button>
            <Button variant="outline" icon={<RefreshCw />} loading={reloading} onClick={() => void handleReload()}>
              Reload from database
            </Button>
            <Button
              variant="ghost"
              icon={<Trash2 />}
              onClick={async () => {
                const confirmed = await confirm({
                  title: 'Restore default preferences',
                  message:
                    'Appearance, display, filtering and alert preferences will return to their shipped defaults. Employer data is not affected.',
                  confirmLabel: 'Restore defaults',
                  destructive: true,
                });
                if (!confirmed) return;
                updateSettings({ ...DEFAULT_SETTINGS });
                toast({ title: 'Preferences restored', variant: 'success' });
              }}
            >
              Restore default preferences
            </Button>
          </div>
        </Card>

        {/* Team & access (admin) --------------------------------------- */}
        {isAdmin && (
          <Card className="xl:col-span-2">
            <CardHeader
              title="Team & access"
              description="Staff accounts are managed from the Administration area. Only administrators can invite or disable staff."
              icon={<UserCog />}
            />
            <div className="flex flex-wrap items-center gap-2">
              <Button variant="primary" icon={<UserCog />} onClick={() => navigate('/admin/staff')}>
                Open Staff Management
              </Button>
              <Badge tone="brand" size="md">
                Signed in as {profile?.full_name || profile?.email} (administrator)
              </Badge>
            </div>
          </Card>
        )}
      </div>

      {dialog}
    </>
  );
}
