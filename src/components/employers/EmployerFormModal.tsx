import { useEffect, useMemo, useState } from 'react';
import { AlertCircle, Building2, Save } from 'lucide-react';
import type { EmployerDraft, EmployerRecord, FeeType } from '@/types';
import {
  ANNUAL_LEAVE_OPTIONS,
  AIRFARE_OPTIONS,
  COUNTRIES,
  COUNTRY_CURRENCY,
  CURRENCIES,
  EMPLOYER_SIZES,
  EMPLOYER_STATUSES,
  EMPLOYMENT_TYPES,
  FEE_TYPES,
  INDUSTRIES,
  JOB_CATEGORIES,
  OVERTIME_OPTIONS,
  POSITIONS,
  PROVISION_LEVELS,
  VERIFICATION_STATUSES,
  WORKING_HOURS,
} from '@/lib/constants';
import { createEmptyDraft, draftFromRecord, hasErrors, validateEmployerDraft } from '@/lib/employerDraft';
import { formatCurrency } from '@/lib/utils';
import { useAppStore } from '@/store/AppStore';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Checkbox, Switch } from '@/components/ui/Checkbox';
import { Input, Textarea } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';

export interface EmployerFormModalProps {
  open: boolean;
  onClose: () => void;
  /** Present when editing; omitted when registering a new employer. */
  record?: EmployerRecord | null;
}

const toOptions = (values: readonly string[]) => values.map((value) => ({ value, label: value }));

/** Groups the long form into labelled sections without a wizard step-count. */
function FormSection({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="border-ink-200 border-b pb-5 last:border-b-0 last:pb-0">
      <h3 className="text-ink-900 text-[13px] font-semibold">{title}</h3>
      {description && <p className="text-ink-500 mt-0.5 mb-3 text-xs leading-relaxed">{description}</p>}
      <div className={description ? '' : 'mt-3'}>{children}</div>
    </section>
  );
}

/**
 * Employer registration / edit form.
 *
 * Validation is derived from the draft on every render, but only surfaced after
 * the first submit attempt — so a user is never scolded for a field they have
 * not reached yet, and every error clears the moment it is fixed.
 */
export function EmployerFormModal({ open, onClose, record }: EmployerFormModalProps) {
  const { createEmployer, saveEmployer, toast, settings } = useAppStore();
  const [draft, setDraft] = useState<EmployerDraft>(() => createEmptyDraft());
  const [submitted, setSubmitted] = useState(false);
  const [saving, setSaving] = useState(false);

  /* Reset the form whenever the dialog is opened for a different target. */
  useEffect(() => {
    if (!open) return;
    setSubmitted(false);
    setDraft(
      record
        ? draftFromRecord(record)
        : createEmptyDraft({
            country: settings.defaultCountry || undefined,
            status: settings.defaultEmployerStatus || undefined,
          }),
    );
  }, [open, record, settings.defaultCountry, settings.defaultEmployerStatus]);

  const errors = useMemo(() => validateEmployerDraft(draft), [draft]);
  const visibleErrors = submitted ? errors : {};
  const errorCount = Object.keys(errors).length;

  const update = <K extends keyof EmployerDraft>(key: K, value: EmployerDraft[K]) =>
    setDraft((current) => ({ ...current, [key]: value }));

  const updateFee = (type: FeeType, amount: number) =>
    setDraft((current) => ({ ...current, fees: { ...current.fees, [type]: amount } }));

  const feeTotal = Object.values(draft.fees).reduce((total, amount) => total + (amount || 0), 0);

  const handleCountryChange = (country: string) => {
    setDraft((current) => ({
      ...current,
      country,
      currency: COUNTRY_CURRENCY[country] ?? current.currency,
    }));
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setSubmitted(true);

    if (hasErrors(errors)) {
      toast({
        title: 'Form has errors',
        description: `Fix ${errorCount} field${errorCount === 1 ? '' : 's'} before saving.`,
        variant: 'error',
      });
      return;
    }

    setSaving(true);
    try {
      if (record) {
        const ok = await saveEmployer(record.employer.id, draft);
        if (!ok) return;
        toast({
          title: 'Employer updated',
          description: `${draft.companyName} has been saved.`,
          variant: 'success',
        });
      } else {
        const created = await createEmployer(draft);
        if (!created) return;
        toast({
          title: 'Employer added',
          description: `${draft.companyName} was added with a job order, fee schedule and requirement checklist.`,
          variant: 'success',
        });
      }
      onClose();
    } finally {
      setSaving(false);
    }
  };

  const currencyOptions = Object.keys(CURRENCIES).map((code) => ({
    value: code,
    label: `${code} — ${CURRENCIES[code].label}`,
  }));

  return (
    <Modal
      open={open}
      onClose={onClose}
      size="lg"
      icon={<Building2 />}
      title={record ? `Edit ${record.employer.companyName}` : 'Register new employer'}
      description={
        record
          ? 'Update company details, the job order, fee schedule and benefits package.'
          : 'Registering an employer also creates their first job order, fee schedule and requirement checklist.'
      }
      footer={
        <>
          <div className="mr-auto hidden text-xs sm:block">
            <span className="text-ink-500">Total estimated fees </span>
            <span className="text-ink-900 tnum font-semibold">{formatCurrency(feeTotal)}</span>
            {submitted && errorCount > 0 && (
              <span className="text-rose-600 ml-3 font-medium">
                {errorCount} field{errorCount === 1 ? '' : 's'} need attention
              </span>
            )}
          </div>
          <Button variant="outline" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button type="submit" form="employer-form" variant="primary" icon={<Save />} loading={saving}>
            {record ? 'Save changes' : 'Add employer'}
          </Button>
        </>
      }
    >
      <form id="employer-form" onSubmit={handleSubmit} noValidate className="flex flex-col gap-5">
        {submitted && errorCount > 0 && (
          <div className="border-rose-200 bg-rose-50 flex items-start gap-2.5 rounded-lg border px-3 py-2.5">
            <AlertCircle className="text-rose-600 mt-0.5 h-4 w-4 shrink-0" />
            <div className="text-rose-700 text-xs leading-relaxed">
              <p className="font-semibold">This employer could not be saved.</p>
              <ul className="mt-1 list-inside list-disc">
                {Object.values(errors).map((message) => (
                  <li key={message}>{message}</li>
                ))}
              </ul>
            </div>
          </div>
        )}

        <FormSection title="Company" description="Legal identity and where the employer operates.">
          <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
            <Input
              label="Company name *"
              name="companyName"
              value={draft.companyName}
              onChange={(event) => update('companyName', event.target.value)}
              error={visibleErrors.companyName}
              placeholder="e.g. Sakura Manufacturing Group"
              containerClassName="sm:col-span-2"
            />
            <Input
              label="Registered legal name"
              name="legalName"
              value={draft.legalName}
              onChange={(event) => update('legalName', event.target.value)}
              placeholder="Defaults to the company name"
            />
            <Input
              label="Registration number"
              name="registrationNumber"
              value={draft.registrationNumber}
              onChange={(event) => update('registrationNumber', event.target.value)}
              placeholder="e.g. JP-TOK-2014-118342"
            />
            <Select
              label="Country *"
              name="country"
              options={COUNTRIES.map((country) => ({ value: country.value, label: country.label }))}
              value={draft.country}
              onChange={(event) => handleCountryChange(event.target.value)}
              error={visibleErrors.country}
            />
            <Input
              label="City *"
              name="city"
              value={draft.city}
              onChange={(event) => update('city', event.target.value)}
              error={visibleErrors.city}
              placeholder="e.g. Nagoya"
            />
            <Input
              label="Address"
              name="address"
              value={draft.address}
              onChange={(event) => update('address', event.target.value)}
              containerClassName="sm:col-span-2"
            />
            <Select
              label="Industry *"
              name="industry"
              options={toOptions(INDUSTRIES)}
              value={draft.industry}
              onChange={(event) => update('industry', event.target.value)}
              error={visibleErrors.industry}
            />
            <Select
              label="Company size"
              name="companySize"
              options={toOptions(EMPLOYER_SIZES)}
              value={draft.companySize}
              onChange={(event) => update('companySize', event.target.value)}
            />
            <Input
              label="Website"
              name="website"
              value={draft.website}
              onChange={(event) => update('website', event.target.value)}
              error={visibleErrors.website}
              placeholder="www.example.com"
              containerClassName="sm:col-span-2"
            />
            <Textarea
              label="Company description"
              name="description"
              rows={3}
              value={draft.description}
              onChange={(event) => update('description', event.target.value)}
              error={visibleErrors.description}
              hint="Shown on the employer profile. Minimum 20 characters if provided."
              containerClassName="sm:col-span-2"
            />
          </div>
        </FormSection>

        <FormSection title="Contact" description="Who the agency coordinates with at the employer.">
          <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
            <Input
              label="Contact person *"
              name="contactPerson"
              value={draft.contactPerson}
              onChange={(event) => update('contactPerson', event.target.value)}
              error={visibleErrors.contactPerson}
            />
            <Input
              label="Role / position"
              name="contactRole"
              value={draft.contactRole}
              onChange={(event) => update('contactRole', event.target.value)}
              placeholder="e.g. HR Manager"
            />
            <Input
              label="Email *"
              name="email"
              type="email"
              value={draft.email}
              onChange={(event) => update('email', event.target.value)}
              error={visibleErrors.email}
              placeholder="hr@example.com"
            />
            <Input
              label="Phone"
              name="phone"
              value={draft.phone}
              onChange={(event) => update('phone', event.target.value)}
              error={visibleErrors.phone}
              placeholder="+81 52-000-0000"
            />
          </div>
        </FormSection>

        <FormSection title="Employment" description="The first job order attached to this employer.">
          <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
            <Select
              label="Position *"
              name="position"
              options={toOptions(POSITIONS)}
              value={draft.position}
              onChange={(event) => update('position', event.target.value)}
              error={visibleErrors.position}
            />
            <Select
              label="Job category *"
              name="jobCategory"
              options={toOptions(JOB_CATEGORIES)}
              value={draft.jobCategory}
              onChange={(event) => update('jobCategory', event.target.value)}
              error={visibleErrors.jobCategory}
            />
            <Select
              label="Currency"
              name="currency"
              options={currencyOptions}
              value={draft.currency}
              onChange={(event) => update('currency', event.target.value)}
            />
            <Select
              label="Contract duration *"
              name="contractDurationMonths"
              options={[
                { value: 6, label: '6 months' },
                { value: 12, label: '1 year' },
                { value: 24, label: '2 years' },
                { value: 36, label: '3 years' },
                { value: 60, label: '5 years' },
              ]}
              value={draft.contractDurationMonths}
              onChange={(event) => update('contractDurationMonths', Number(event.target.value))}
              error={visibleErrors.contractDurationMonths}
            />
            <Input
              label="Minimum monthly salary *"
              name="salaryMinLocal"
              type="number"
              min={0}
              value={draft.salaryMinLocal || ''}
              onChange={(event) => update('salaryMinLocal', Number(event.target.value))}
              error={visibleErrors.salaryMinLocal}
              suffix={<span className="text-ink-400 text-xs">{draft.currency}</span>}
            />
            <Input
              label="Maximum monthly salary *"
              name="salaryMaxLocal"
              type="number"
              min={0}
              value={draft.salaryMaxLocal || ''}
              onChange={(event) => update('salaryMaxLocal', Number(event.target.value))}
              error={visibleErrors.salaryMaxLocal}
              suffix={<span className="text-ink-400 text-xs">{draft.currency}</span>}
            />
            {visibleErrors.salaryRange && (
              <p className="text-rose-600 -mt-2 text-xs sm:col-span-2">{visibleErrors.salaryRange}</p>
            )}
            <Select
              label="Working hours"
              name="workingHours"
              options={toOptions(WORKING_HOURS)}
              value={draft.workingHours}
              onChange={(event) => update('workingHours', event.target.value as EmployerDraft['workingHours'])}
            />
            <Select
              label="Overtime"
              name="overtime"
              options={toOptions(OVERTIME_OPTIONS)}
              value={draft.overtime}
              onChange={(event) => update('overtime', event.target.value as EmployerDraft['overtime'])}
            />
            <Select
              label="Employment type"
              name="employmentType"
              options={toOptions(EMPLOYMENT_TYPES)}
              value={draft.employmentType}
              onChange={(event) => update('employmentType', event.target.value as EmployerDraft['employmentType'])}
            />
            <Input
              label="Workers needed *"
              name="workersNeeded"
              type="number"
              min={1}
              value={draft.workersNeeded || ''}
              onChange={(event) => update('workersNeeded', Number(event.target.value))}
              error={visibleErrors.workersNeeded}
            />
          </div>
        </FormSection>

        <FormSection
          title="Fees"
          description="Amounts in Philippine pesos. The total below is what the worker is quoted."
        >
          <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 lg:grid-cols-3">
            {FEE_TYPES.map((type) => (
              <Input
                key={type}
                label={type}
                name={`fee-${type}`}
                type="number"
                min={0}
                value={draft.fees[type] || ''}
                onChange={(event) => updateFee(type, Number(event.target.value))}
                placeholder="0"
                suffix={<span className="text-ink-400 text-xs">PHP</span>}
              />
            ))}
          </div>
          <div className="bg-ink-50 mt-3 flex items-center justify-between rounded-lg px-3 py-2">
            <span className="text-ink-600 text-xs font-medium">Total estimated fees</span>
            <span className="text-ink-900 tnum text-sm font-semibold">{formatCurrency(feeTotal)}</span>
          </div>
        </FormSection>

        <FormSection title="Benefits" description="What the employer provides on top of base salary.">
          <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 lg:grid-cols-3">
            <Select
              label="Accommodation"
              name="accommodation"
              options={toOptions(PROVISION_LEVELS)}
              value={draft.benefits.accommodation}
              onChange={(event) =>
                update('benefits', {
                  ...draft.benefits,
                  accommodation: event.target.value as EmployerDraft['benefits']['accommodation'],
                })
              }
            />
            <Select
              label="Transportation"
              name="transportation"
              options={toOptions(PROVISION_LEVELS)}
              value={draft.benefits.transportation}
              onChange={(event) =>
                update('benefits', {
                  ...draft.benefits,
                  transportation: event.target.value as EmployerDraft['benefits']['transportation'],
                })
              }
            />
            <Select
              label="Food allowance"
              name="foodAllowance"
              options={toOptions(PROVISION_LEVELS)}
              value={draft.benefits.foodAllowance}
              onChange={(event) =>
                update('benefits', {
                  ...draft.benefits,
                  foodAllowance: event.target.value as EmployerDraft['benefits']['foodAllowance'],
                })
              }
            />
            <Select
              label="Annual leave"
              name="annualLeave"
              options={toOptions(ANNUAL_LEAVE_OPTIONS)}
              value={draft.benefits.annualLeave}
              onChange={(event) => update('benefits', { ...draft.benefits, annualLeave: event.target.value })}
            />
            <Select
              label="Airfare"
              name="airfare"
              options={toOptions(AIRFARE_OPTIONS)}
              value={draft.benefits.airfare}
              onChange={(event) =>
                update('benefits', {
                  ...draft.benefits,
                  airfare: event.target.value as EmployerDraft['benefits']['airfare'],
                })
              }
            />
            <div className="flex flex-col justify-center gap-3 pt-5">
              <Checkbox
                label="Health insurance provided"
                checked={draft.benefits.healthInsurance}
                onChange={(event) =>
                  update('benefits', { ...draft.benefits, healthInsurance: event.target.checked })
                }
              />
              <Checkbox
                label="Overtime pay available"
                checked={draft.benefits.overtimePay}
                onChange={(event) => update('benefits', { ...draft.benefits, overtimePay: event.target.checked })}
              />
            </div>
          </div>
        </FormSection>

        <FormSection title="Status" description="Where this employer sits in the verification workflow.">
          <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
            <Select
              label="Employer status"
              name="status"
              options={toOptions(EMPLOYER_STATUSES)}
              value={draft.status}
              onChange={(event) => update('status', event.target.value as EmployerDraft['status'])}
            />
            <Select
              label="Verification"
              name="verification"
              options={toOptions(VERIFICATION_STATUSES)}
              value={draft.verification}
              onChange={(event) =>
                update('verification', event.target.value as EmployerDraft['verification'])
              }
            />
          </div>
          {record && (
            <div className="mt-3">
              <Switch
                label="Employer is archived"
                description="Archived employers are hidden from the default employer list and filtering results."
                checked={draft.status === 'Archived'}
                onChange={(event) => update('status', event.target.checked ? 'Archived' : 'Active')}
              />
            </div>
          )}
        </FormSection>
      </form>
    </Modal>
  );
}
