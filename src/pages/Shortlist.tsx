import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Download, Heart, MapPin, Pencil, Scale, Trash2, Users, X } from 'lucide-react';
import type { EmployerRecord } from '@/types';
import { downloadFile, formatCurrency, toCsv } from '@/lib/utils';
import { effectiveContractStatus } from '@/lib/selectors';
import { useAppStore } from '@/store/AppStore';
import { useConfirmDialog } from '@/hooks/useConfirmDialog';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button, IconButton } from '@/components/ui/Button';
import { CompanyLogo } from '@/components/ui/CompanyLogo';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { Textarea } from '@/components/ui/Input';
import { EmptyState } from '@/components/ui/EmptyState';
import { Tooltip } from '@/components/ui/Tooltip';
import { ContractStatusBadge, EmployerStatusBadge, VerificationBadge } from '@/components/common/StatusBadge';
import { CurrencyAmount, ExpiryCountdown, RelativeTimeText, SalaryRange } from '@/components/common/ValueText';
import { completionTone } from '@/lib/tokens';

/**
 * Shortlist.
 *
 * Entries live in the store, so adding an employer from any table, card or
 * profile immediately updates the sidebar counter and this page. Each entry can
 * carry a working note explaining why it was shortlisted.
 */
export default function ShortlistPage() {
  const {
    records,
    shortlist,
    toggleShortlist,
    updateShortlistNote,
    toggleComparison,
    isComparing,
    toast,
  } = useAppStore();
  const { confirm, dialog } = useConfirmDialog();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [noteDraft, setNoteDraft] = useState('');

  const entries = useMemo(
    () =>
      shortlist
        .map((entry) => ({
          entry,
          record: records.find((record) => record.employer.id === entry.employerId),
        }))
        .filter((item): item is { entry: typeof shortlist[number]; record: EmployerRecord } => Boolean(item.record)),
    [shortlist, records],
  );

  const startEditing = (record: EmployerRecord, note: string) => {
    setEditingId(record.employer.id);
    setNoteDraft(note);
  };

  const saveNote = (id: string) => {
    updateShortlistNote(id, noteDraft.trim());
    setEditingId(null);
    toast({ title: 'Note saved', variant: 'success' });
  };

  const handleRemove = async (record: EmployerRecord) => {
    const confirmed = await confirm({
      title: 'Remove from shortlist',
      message: `${record.employer.companyName} will be removed from the shortlist. The employer record itself is not deleted.`,
      confirmLabel: 'Remove',
      destructive: true,
    });
    if (confirmed) toggleShortlist(record.employer.id);
  };

  const handleExport = () => {
    const csv = toCsv(
      entries.map(({ record, entry }) => ({
        Company: record.employer.companyName,
        Country: record.employer.country,
        Industry: record.employer.industry,
        Position: record.primaryJob?.position ?? '',
        'Salary (PHP)': `${record.salaryMinPhp}-${record.salaryMaxPhp}`,
        'Total fees (PHP)': record.totalEstimatedCost,
        'Contract status': effectiveContractStatus(record),
        'Requirements (%)': record.requirementCompletion,
        'Added by': entry.addedBy,
        Note: entry.note,
      })),
    );
    downloadFile(`efms-shortlist-${new Date().toISOString().slice(0, 10)}.csv`, csv);
    toast({ title: 'Shortlist exported', description: `${entries.length} employers downloaded.`, variant: 'success' });
  };

  return (
    <>
      <PageHeader
        title="Shortlist"
        description="Employers earmarked for the next deployment batch. Add a note to record why each one was chosen."
        actions={
          <>
            <Link
              to="/employers"
              className="border-ink-300 text-ink-700 hover:bg-ink-50 inline-flex h-9 items-center gap-2 rounded-lg border px-3.5 text-sm font-medium"
            >
              <Users className="h-4 w-4" />
              Browse employers
            </Link>
            <Button variant="outline" icon={<Download />} onClick={handleExport} disabled={entries.length === 0}>
              Export shortlist
            </Button>
            {entries.length >= 2 && (
              <Button
                variant="primary"
                icon={<Scale />}
                onClick={() => {
                  entries.slice(0, 4).forEach(({ record }) => {
                    if (!isComparing(record.employer.id)) toggleComparison(record.employer.id);
                  });
                  toast({
                    title: 'Sent to comparison',
                    description: 'The first four shortlisted employers are ready to compare.',
                    variant: 'success',
                  });
                }}
              >
                Compare shortlist
              </Button>
            )}
          </>
        }
      />

      {entries.length === 0 ? (
        <Card>
          <EmptyState
            title="Your shortlist is empty"
            description="Shortlist an employer from the database, the filtering workspace or an employer profile — it will appear here straight away."
            action={
              <Link
                to="/employers"
                className="bg-brand-600 hover:bg-brand-700 inline-flex h-9 items-center gap-2 rounded-lg px-3.5 text-sm font-medium text-white"
              >
                <Heart className="h-4 w-4" />
                Find employers to shortlist
              </Link>
            }
          />
        </Card>
      ) : (
        <>
          <div className="mb-3 flex flex-wrap items-center gap-2">
            <Badge tone="brand" size="md">
              {entries.length} shortlisted employer{entries.length === 1 ? '' : 's'}
            </Badge>
            <span className="text-ink-500 text-[11px]">
              Average requirement completion:{' '}
              <span className="text-ink-800 font-semibold">
                {Math.round(
                  entries.reduce((sum, { record }) => sum + record.requirementCompletion, 0) / entries.length,
                )}
                %
              </span>
            </span>
          </div>

          <ul className="flex flex-col gap-3">
            {entries.map(({ record, entry }) => {
              const comparing = isComparing(record.employer.id);
              const editing = editingId === record.employer.id;

              return (
                <li key={record.employer.id}>
                  <Card>
                    <div className="flex flex-col gap-4 lg:flex-row">
                      {/* Identity */}
                      <div className="flex min-w-0 flex-1 items-start gap-3">
                        <CompanyLogo
                          initials={record.employer.logoInitials}
                          hue={record.employer.logoHue}
                          size="lg"
                          square
                        />
                        <div className="min-w-0 flex-1">
                          <Link
                            to={`/employers/${record.employer.id}`}
                            className="text-ink-900 hover:text-brand-700 text-sm font-semibold"
                          >
                            {record.employer.companyName}
                          </Link>
                          <p className="text-ink-500 mt-0.5 flex items-center gap-1.5 text-xs">
                            <MapPin className="h-3 w-3 shrink-0" />
                            <span className="truncate">
                              {record.employer.city}, {record.employer.country} · {record.employer.industry}
                            </span>
                          </p>
                          <div className="mt-2 flex flex-wrap items-center gap-1.5">
                            <EmployerStatusBadge status={record.employer.status} />
                            <VerificationBadge status={record.employer.verification} />
                            <ContractStatusBadge status={effectiveContractStatus(record)} />
                          </div>
                          <p className="text-ink-400 mt-2 text-[10px]">
                            Added by {entry.addedBy} · <RelativeTimeText iso={entry.addedAt} />
                          </p>
                        </div>
                      </div>

                      {/* Metrics */}
                      <div className="grid shrink-0 grid-cols-2 gap-x-6 gap-y-3 lg:w-72">
                        <div>
                          <p className="text-ink-500 text-[10px] font-semibold tracking-wide uppercase">Salary</p>
                          <SalaryRange
                            minPhp={record.salaryMinPhp}
                            maxPhp={record.salaryMaxPhp}
                            minLocal={record.primaryJob?.salaryMinLocal ?? 0}
                            maxLocal={record.primaryJob?.salaryMaxLocal ?? 0}
                            currency={record.primaryJob?.currency ?? 'PHP'}
                            className="text-ink-800 mt-0.5 text-[12px]"
                            compact
                          />
                        </div>
                        <div>
                          <p className="text-ink-500 text-[10px] font-semibold tracking-wide uppercase">Total fees</p>
                          <CurrencyAmount
                            value={record.totalEstimatedCost}
                            className="text-ink-800 mt-0.5 block text-[12px] font-medium"
                          />
                        </div>
                        <div>
                          <p className="text-ink-500 text-[10px] font-semibold tracking-wide uppercase">Contract</p>
                          <div className="mt-0.5">
                            <ExpiryCountdown days={record.daysToContractExpiry} />
                          </div>
                        </div>
                        <div>
                          <p className="text-ink-500 text-[10px] font-semibold tracking-wide uppercase">Positions</p>
                          <p className="text-ink-800 tnum mt-0.5 text-[12px] font-medium">
                            {record.positionsAvailable} open
                          </p>
                        </div>
                        <div className="col-span-2">
                          <ProgressBar
                            value={record.requirementCompletion}
                            tone={completionTone(record.requirementCompletion)}
                            size="sm"
                            label="Requirements"
                            showLabel
                          />
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex shrink-0 flex-wrap items-start gap-1.5 lg:flex-col lg:items-stretch">
                        <Button
                          size="sm"
                          variant="outline"
                          icon={<Pencil />}
                          onClick={() => startEditing(record, entry.note)}
                        >
                          Note
                        </Button>
                        <Button
                          size="sm"
                          variant={comparing ? 'primary' : 'outline'}
                          icon={<Scale />}
                          onClick={() => toggleComparison(record.employer.id)}
                        >
                          {comparing ? 'Comparing' : 'Compare'}
                        </Button>
                        <Tooltip content="Remove from shortlist">
                          <Button
                            size="sm"
                            variant="danger-outline"
                            icon={<X />}
                            onClick={() => void handleRemove(record)}
                          >
                            Remove
                          </Button>
                        </Tooltip>
                      </div>
                    </div>

                    {/* Note */}
                    <div className="border-ink-200 mt-3.5 border-t pt-3.5">
                      {editing ? (
                        <div className="flex flex-col gap-2">
                          <Textarea
                            rows={2}
                            value={noteDraft}
                            onChange={(event) => setNoteDraft(event.target.value)}
                            placeholder="Why is this employer on the shortlist?"
                            aria-label="Shortlist note"
                          />
                          <div className="flex items-center gap-2">
                            <Button size="sm" variant="primary" onClick={() => saveNote(record.employer.id)}>
                              Save note
                            </Button>
                            <Button size="sm" variant="ghost" onClick={() => setEditingId(null)}>
                              Cancel
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-start gap-2">
                          <p className="text-ink-600 min-w-0 flex-1 text-[13px] leading-relaxed italic">
                            {entry.note || 'No note added yet.'}
                          </p>
                          <IconButton
                            size="sm"
                            label="Delete shortlist entry"
                            onClick={() => void handleRemove(record)}
                            className="hover:bg-rose-50 hover:text-rose-600"
                          >
                            <Trash2 />
                          </IconButton>
                        </div>
                      )}
                    </div>
                  </Card>
                </li>
              );
            })}
          </ul>

          <p className="text-ink-500 mt-3 text-[11px]">
            Total indicative annual salary value:{' '}
            <span className="text-ink-800 font-semibold">
              {formatCurrency(
                entries.reduce((sum, { record }) => sum + record.salaryMaxPhp * 12, 0),
                'PHP',
                { compact: true },
              )}
            </span>
          </p>
        </>
      )}

      {dialog}
    </>
  );
}
