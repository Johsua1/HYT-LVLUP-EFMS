import { useMemo, useState } from 'react';
import { Receipt, Save, Undo2 } from 'lucide-react';
import type { EmployerRecord, FeeItem, FeeType, PaymentStatus } from '@/types';
import { FEE_TYPES, PAYMENT_STATUSES } from '@/lib/constants';
import { FEE_GROUP } from '@/lib/tokens';
import { computeTotalEstimatedCost, feeTotalsOf } from '@/lib/selectors';
import { cn, formatCurrency } from '@/lib/utils';
import { useAppStore } from '@/store/AppStore';
import { Card, CardHeader } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Select } from '@/components/ui/Select';
import { PaymentStatusBadge } from '@/components/common/StatusBadge';
import { CurrencyAmount } from '@/components/common/ValueText';

export interface FeeEditorProps {
  record: EmployerRecord;
  /** Renders without the surrounding card — used inside the employer profile. */
  bare?: boolean;
  className?: string;
}

const BORNE_BY = ['Worker', 'Employer', 'Shared'] as const;

/**
 * Editable fee schedule.
 *
 * Amounts are held in the store, so the moment a field loses focus every
 * dependent number in the application — the total here, the employer table's
 * fee column, the dashboard averages and the fee filters — is recomputed.
 */
export function FeeEditor({ record, bare = false, className }: FeeEditorProps) {
  const { updateFee, toast } = useAppStore();
  const [draft, setDraft] = useState<Record<string, string>>({});

  const totals = useMemo(() => feeTotalsOf(record.fees), [record.fees]);
  const workerTotal = useMemo(() => computeTotalEstimatedCost(record.fees), [record.fees]);

  const orderedFees = useMemo(() => {
    const byType = new Map<FeeType, FeeItem>(record.fees.map((fee) => [fee.type, fee]));
    return FEE_TYPES.map((type) => byType.get(type)).filter((fee): fee is FeeItem => Boolean(fee));
  }, [record.fees]);

  const grossTotal = orderedFees.reduce((sum, fee) => sum + fee.amount, 0);

  const commitAmount = async (fee: FeeItem) => {
    const raw = draft[fee.id];
    if (raw === undefined) return;
    const parsed = Number(raw);
    const next = Number.isFinite(parsed) && parsed >= 0 ? parsed : fee.amount;
    setDraft((current) => {
      const next = { ...current };
      delete next[fee.id];
      return next;
    });
    if (next !== fee.amount) {
      await updateFee(fee.id, { amount: next });
      toast({
        title: 'Fee updated',
        description: `${fee.type} set to ${formatCurrency(next)} for ${record.employer.companyName}.`,
        variant: 'success',
      });
    }
  };

  const body = (
    <div className="flex flex-col gap-4">
      <div className="border-ink-200 overflow-hidden rounded-lg border">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="bg-ink-50 border-ink-200 border-b">
              <th className="text-ink-500 px-3 py-2 text-[11px] font-semibold tracking-wider uppercase">Fee</th>
              <th className="text-ink-500 hidden px-3 py-2 text-[11px] font-semibold tracking-wider uppercase sm:table-cell">
                Borne by
              </th>
              <th className="text-ink-500 hidden px-3 py-2 text-[11px] font-semibold tracking-wider uppercase md:table-cell">
                Payment
              </th>
              <th className="text-ink-500 px-3 py-2 text-right text-[11px] font-semibold tracking-wider uppercase">
                Amount (PHP)
              </th>
            </tr>
          </thead>
          <tbody>
            {orderedFees.map((fee) => (
              <tr key={fee.id} className="border-ink-200/80 border-b last:border-b-0">
                <td className="px-3 py-2">
                  <p className="text-ink-800 text-[13px] font-medium">{fee.type}</p>
                  <p className="text-ink-500 text-[10px]">{FEE_GROUP[fee.type]} fee</p>
                </td>
                <td className="hidden px-3 py-2 sm:table-cell">
                  <Select
                    aria-label={`${fee.type} borne by`}
                    className="h-8 text-[12px]"
                    options={BORNE_BY.map((value) => ({ value, label: value }))}
                    value={fee.borneBy}
                    onChange={(event) =>
                      updateFee(fee.id, { borneBy: event.target.value as FeeItem['borneBy'] })
                    }
                  />
                </td>
                <td className="hidden px-3 py-2 md:table-cell">
                  <Select
                    aria-label={`${fee.type} payment status`}
                    className="h-8 text-[12px]"
                    options={PAYMENT_STATUSES.map((value) => ({ value, label: value }))}
                    value={fee.paymentStatus}
                    onChange={(event) =>
                      updateFee(fee.id, { paymentStatus: event.target.value as PaymentStatus })
                    }
                  />
                </td>
                <td className="px-3 py-2 text-right">
                  <div className="relative ml-auto w-32">
                    <span className="text-ink-400 pointer-events-none absolute top-1/2 left-2.5 -translate-y-1/2 text-xs">
                      ₱
                    </span>
                    <input
                      type="number"
                      min={0}
                      inputMode="numeric"
                      aria-label={`${fee.type} amount`}
                      value={draft[fee.id] ?? String(fee.amount)}
                      onChange={(event) => setDraft((current) => ({ ...current, [fee.id]: event.target.value }))}
                      onBlur={() => commitAmount(fee)}
                      onKeyDown={(event) => {
                        if (event.key === 'Enter') {
                          event.preventDefault();
                          commitAmount(fee);
                        }
                      }}
                      className="border-ink-300 text-ink-800 focus:border-brand-500 focus:ring-brand-500/20 tnum h-8 w-full rounded-md border pr-2 pl-6 text-right text-[13px] focus:ring-2 focus:outline-none"
                    />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="bg-ink-50 border-ink-200 border-t">
              <td className="text-ink-700 px-3 py-2.5 text-[12px] font-semibold" colSpan={3}>
                Total estimated cost to the worker
                <span className="text-ink-500 ml-1 font-normal">
                  (employer-borne and not-applicable lines excluded)
                </span>
              </td>
              <td className="px-3 py-2.5 text-right">
                <CurrencyAmount value={workerTotal} className="text-ink-900 text-sm font-semibold" />
              </td>
            </tr>
          </tfoot>
        </table>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div className="bg-ink-50 rounded-lg px-3 py-2.5">
          <p className="text-ink-500 text-[10px] font-semibold tracking-wide uppercase">Gross fee total</p>
          <CurrencyAmount value={grossTotal} className="text-ink-900 mt-1 block text-sm font-semibold" />
        </div>
        <div className="bg-ink-50 rounded-lg px-3 py-2.5">
          <p className="text-ink-500 text-[10px] font-semibold tracking-wide uppercase">Worker-borne</p>
          <CurrencyAmount value={workerTotal} className="text-ink-900 mt-1 block text-sm font-semibold" />
        </div>
        <div className="bg-ink-50 rounded-lg px-3 py-2.5">
          <p className="text-ink-500 text-[10px] font-semibold tracking-wide uppercase">Employer-borne</p>
          <CurrencyAmount value={grossTotal - workerTotal} className="text-ink-900 mt-1 block text-sm font-semibold" />
        </div>
      </div>

      <div>
        <p className="text-ink-600 mb-2 text-xs font-medium">Fee mix</p>
        <ul className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          {orderedFees.map((fee) => (
            <li key={fee.id} className="flex items-center justify-between gap-3">
              <span className="text-ink-600 truncate text-[12px]">{fee.type}</span>
              <span className="flex items-center gap-2">
                <PaymentStatusBadge status={fee.paymentStatus} />
                <CurrencyAmount value={totals[fee.type]} className="text-ink-800 text-[12px] font-medium" />
              </span>
            </li>
          ))}
        </ul>
      </div>

      <div className="text-ink-500 flex items-start gap-2 text-[11px] leading-relaxed">
        <Save className="mt-0.5 h-3.5 w-3.5 shrink-0" />
        <p>
          Changes save as you leave a field (or press Enter). Fee totals, the employer table and every filter that
          references fees update immediately.
        </p>
      </div>
    </div>
  );

  if (bare) return <div className={className}>{body}</div>;

  return (
    <Card className={className}>
      <CardHeader
        title="Fee schedule"
        description="Amounts are quoted in Philippine pesos. Employer-borne lines are excluded from the worker's total."
        icon={<Receipt />}
        actions={
          <Button
            size="sm"
            variant="ghost"
            icon={<Undo2 />}
            onClick={() => {
              setDraft({});
              toast({ title: 'Edits discarded', description: 'Fields reset to the saved values.', variant: 'info' });
            }}
            disabled={Object.keys(draft).length === 0}
          >
            Discard edits
          </Button>
        }
      />
      <div className={cn(bare && '')}>{body}</div>
    </Card>
  );
}
