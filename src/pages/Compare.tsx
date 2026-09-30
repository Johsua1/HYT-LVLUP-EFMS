import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Plus, Scale, Search, Trash2, X } from 'lucide-react';
import { MAX_COMPARISON } from '@/types';
import { cn } from '@/lib/utils';
import { useAppStore } from '@/store/AppStore';
import { useConfirmDialog } from '@/hooks/useConfirmDialog';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Checkbox } from '@/components/ui/Checkbox';
import { Modal } from '@/components/ui/Modal';
import { EmptyState } from '@/components/ui/EmptyState';
import { Badge } from '@/components/ui/Badge';
import { CompanyLogo } from '@/components/ui/CompanyLogo';
import { EmployerStatusBadge, VerificationBadge } from '@/components/common/StatusBadge';
import { SalaryRange } from '@/components/common/ValueText';
import { ComparisonMatrix } from '@/components/comparison/ComparisonMatrix';

/**
 * Employer comparison workspace.
 *
 * Holds two to four employers. The selection lives in the store (and therefore
 * in localStorage), so shortlisting an employer from the table or the filter
 * results is enough to bring it here.
 */
export default function ComparePage() {
  const {
    comparisonRecords,
    comparison,
    records,
    toggleComparison,
    removeFromComparison,
    clearComparison,
  } = useAppStore();
  const { confirm, dialog } = useConfirmDialog();
  const [pickerOpen, setPickerOpen] = useState(false);
  const [query, setQuery] = useState('');

  const candidates = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return records
      .filter((record) => record.employer.status !== 'Archived')
      .filter((record) =>
        needle
          ? `${record.employer.companyName} ${record.employer.country} ${record.employer.industry}`
              .toLowerCase()
              .includes(needle)
          : true,
      )
      .sort((a, b) => a.employer.companyName.localeCompare(b.employer.companyName));
  }, [records, query]);

  const atCapacity = comparison.length >= MAX_COMPARISON;

  const handleClear = async () => {
    const confirmed = await confirm({
      title: 'Clear comparison',
      message: 'Every employer will be removed from the comparison workspace. The employers themselves are not affected.',
      confirmLabel: 'Clear comparison',
      destructive: true,
    });
    if (confirmed) clearComparison();
  };

  return (
    <>
      <PageHeader
        title="Compare employers"
        description={`Evaluate ${comparison.length} of a maximum of ${MAX_COMPARISON} employers side by side — salary, fees, benefits, contract terms and documentation readiness.`}
        actions={
          <>
            <Link
              to="/employers"
              className="border-ink-300 text-ink-700 hover:bg-ink-50 inline-flex h-9 items-center gap-2 rounded-lg border px-3.5 text-sm font-medium"
            >
              <ArrowLeft className="h-4 w-4" />
              Employer list
            </Link>
            <Button variant="outline" icon={<Trash2 />} onClick={handleClear} disabled={comparison.length === 0}>
              Clear comparison
            </Button>
            <Button
              variant="primary"
              icon={<Plus />}
              onClick={() => setPickerOpen(true)}
              disabled={atCapacity}
              title={atCapacity ? `Comparison is limited to ${MAX_COMPARISON} employers` : 'Add an employer'}
            >
              Add employer
            </Button>
          </>
        }
      />

      {comparison.length === 0 ? (
        <Card>
          <EmptyState
            title="No employers selected for comparison"
            description="Pick two to four employers to compare their salary, fees, benefits, contract terms and documentation readiness side by side."
            action={
              <>
                <Button variant="primary" icon={<Plus />} onClick={() => setPickerOpen(true)}>
                  Add employer
                </Button>
                <Link
                  to="/filter"
                  className="border-ink-300 text-ink-700 hover:bg-ink-50 inline-flex h-9 items-center gap-2 rounded-lg border px-3.5 text-sm font-medium"
                >
                  <Scale className="h-4 w-4" />
                  Find employers with filters
                </Link>
              </>
            }
          />
        </Card>
      ) : comparison.length === 1 ? (
        <Card>
          <EmptyState
            title="Add one more employer"
            description="A comparison needs at least two employers before the differences become useful."
            action={
              <Button variant="primary" icon={<Plus />} onClick={() => setPickerOpen(true)}>
                Add employer
              </Button>
            }
          />
          <div className="border-ink-200 mt-2 border-t pt-4">
            <ComparisonMatrix records={comparisonRecords} onRemove={removeFromComparison} />
          </div>
        </Card>
      ) : (
        <>
          <div className="mb-3 flex flex-wrap items-center gap-2">
            <Badge tone="brand" size="md">
              {comparison.length} employers compared
            </Badge>
            {comparison.length < MAX_COMPARISON && (
              <span className="text-ink-500 text-[11px]">
                You can add {MAX_COMPARISON - comparison.length} more.
              </span>
            )}
            <span className="text-ink-500 ml-auto flex items-center gap-1.5 text-[11px]">
              <span className="inline-block h-2.5 w-2.5 rounded-sm bg-emerald-100 ring-1 ring-emerald-300" />
              Highlighted cells are the strongest value in that row.
            </span>
          </div>

          <Card flush className="overflow-hidden">
            <ComparisonMatrix records={comparisonRecords} onRemove={removeFromComparison} />
          </Card>

          <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {comparisonRecords.map((record) => (
              <Card key={record.employer.id}>
                <div className="flex items-start gap-2.5">
                  <CompanyLogo
                    initials={record.employer.logoInitials}
                    hue={record.employer.logoHue}
                    size="md"
                    square
                  />
                  <div className="min-w-0 flex-1">
                    <Link
                      to={`/employers/${record.employer.id}`}
                      className="text-ink-900 hover:text-brand-700 block truncate text-[13px] font-semibold"
                    >
                      {record.employer.companyName}
                    </Link>
                    <p className="text-ink-500 truncate text-[11px]">
                      {record.employer.country} · {record.employer.industry}
                    </p>
                  </div>
                </div>
                <div className="mt-3 flex flex-wrap gap-1.5">
                  <EmployerStatusBadge status={record.employer.status} />
                  <VerificationBadge status={record.employer.verification} />
                </div>
                <div className="mt-3">
                  <SalaryRange
                    minPhp={record.salaryMinPhp}
                    maxPhp={record.salaryMaxPhp}
                    minLocal={record.primaryJob?.salaryMinLocal ?? 0}
                    maxLocal={record.primaryJob?.salaryMaxLocal ?? 0}
                    currency={record.primaryJob?.currency ?? 'PHP'}
                    className="text-ink-800 text-[13px]"
                    compact
                  />
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  block
                  className="mt-3"
                  icon={<X />}
                  onClick={() => removeFromComparison(record.employer.id)}
                >
                  Remove
                </Button>
              </Card>
            ))}
          </div>
        </>
      )}

      {/* Picker ---------------------------------------------------- */}
      <Modal
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
        size="md"
        icon={<Scale />}
        title="Add employers to compare"
        description={`Select up to ${MAX_COMPARISON} employers. ${comparison.length} currently selected.`}
        footer={
          <Button variant="primary" onClick={() => setPickerOpen(false)}>
            Done
          </Button>
        }
      >
        <div className="relative mb-3">
          <Search className="text-ink-400 pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search employers…"
            aria-label="Search employers to compare"
            className="border-ink-300 text-ink-800 placeholder:text-ink-400 focus:border-brand-500 focus:ring-brand-500/20 h-9 w-full rounded-lg border pr-3 pl-9 text-sm focus:ring-2 focus:outline-none"
          />
        </div>

        <ul className="divide-ink-200 divide-y">
          {candidates.map((record) => {
            const selected = comparison.includes(record.employer.id);
            const disabled = !selected && atCapacity;
            return (
              <li key={record.employer.id} className="py-2.5 first:pt-0">
                <Checkbox
                  checked={selected}
                  disabled={disabled}
                  onChange={() => toggleComparison(record.employer.id)}
                  label={
                    <span className="flex items-center gap-2">
                      <span className="text-ink-900 text-[13px] font-medium">{record.employer.companyName}</span>
                      <Badge tone="neutral">{record.employer.countryCode}</Badge>
                    </span>
                  }
                  description={
                    <span className={cn('block', disabled && 'text-ink-400')}>
                      {record.employer.industry} · {record.employer.city}
                      {disabled && ' · comparison is full'}
                    </span>
                  }
                />
              </li>
            );
          })}
          {candidates.length === 0 && (
            <li>
              <EmptyState
                compact
                variant="search"
                title="No employers match"
                description={`Nothing matched “${query}”.`}
              />
            </li>
          )}
        </ul>

        <div className="border-ink-200 mt-3 flex items-center justify-between gap-2 border-t pt-3">
          <p className="text-ink-500 text-xs">
            {comparison.length} of {MAX_COMPARISON} selected
          </p>
          <Button
            size="sm"
            variant="ghost"
            icon={<Trash2 />}
            onClick={() => clearComparison()}
            disabled={comparison.length === 0}
          >
            Clear all
          </Button>
        </div>
      </Modal>

      {dialog}
    </>
  );
}
