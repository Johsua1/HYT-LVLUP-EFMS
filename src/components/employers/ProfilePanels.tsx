import { useState } from 'react';
import { CheckCircle2, CircleDashed, Clock3, Pin, Plus, ShieldCheck, Trash2, XCircle } from 'lucide-react';
import type { EmployerRecord, VerificationEvent } from '@/types';
import { VERIFICATION_STAGES } from '@/lib/constants';
import { verificationStagesCompleted } from '@/lib/selectors';
import { cn, dateTime } from '@/lib/utils';
import { useAppStore } from '@/store/AppStore';
import { Card, CardHeader } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button, IconButton } from '@/components/ui/Button';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { Textarea } from '@/components/ui/Input';
import { EmptyState } from '@/components/ui/EmptyState';
import { UserAvatar } from '@/components/ui/CompanyLogo';
import { relativeTime } from '@/lib/utils';

/* ------------------------------------------------------------------ */
/* Verification workflow                                               */
/* ------------------------------------------------------------------ */

const OUTCOME_ICON: Record<VerificationEvent['outcome'], React.ReactNode> = {
  completed: <CheckCircle2 className="text-emerald-600" />,
  current: <Clock3 className="text-brand-600" />,
  pending: <CircleDashed className="text-ink-300" />,
  failed: <XCircle className="text-rose-600" />,
};

const OUTCOME_LABEL: Record<VerificationEvent['outcome'], string> = {
  completed: 'Completed',
  current: 'In progress',
  pending: 'Not started',
  failed: 'Returned',
};

/**
 * Five-stage verification workflow.
 *
 * The stage index lives on the employer record, so advancing the workflow here
 * also moves the verification badge, the verification filter and the dashboard
 * verification chart.
 */
export function VerificationTimeline({ record }: { record: EmployerRecord }) {
  const { advanceVerification, setVerification } = useAppStore();
  const { employer, verificationEvents } = record;

  /* A verified employer has every stage complete; otherwise the index is the
     stage currently in progress (see `verificationStagesCompleted`). */
  const completedStages = verificationStagesCompleted(employer);
  const percent = Math.round((completedStages / VERIFICATION_STAGES.length) * 100);

  return (
    <Card>
      <CardHeader
        title="Verification workflow"
        description={`Stage ${Math.min(completedStages + 1, VERIFICATION_STAGES.length)} of ${VERIFICATION_STAGES.length} — ${employer.verification}`}
        icon={<ShieldCheck />}
        actions={
          <>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setVerification(employer.id, 'On Hold', employer.verificationStage)}
            >
              Put on hold
            </Button>
            <Button
              size="sm"
              variant="primary"
              onClick={() => advanceVerification(employer.id)}
              disabled={employer.verification === 'Verified'}
            >
              {employer.verification === 'Verified' ? 'Verified' : 'Advance stage'}
            </Button>
          </>
        }
      />

      <ProgressBar value={percent} label="Workflow progress" showLabel className="mb-4" />

      <ol className="flex flex-col">
        {VERIFICATION_STAGES.map((stage, index) => {
          const event = verificationEvents.find((entry) => entry.stage === stage.label);
          const outcome: VerificationEvent['outcome'] =
            index < completedStages ? 'completed' : index === completedStages ? (event?.outcome ?? 'current') : 'pending';

          return (
            <li key={stage.key} className="relative flex gap-3 pb-5 last:pb-0">
              {index < VERIFICATION_STAGES.length - 1 && (
                <span
                  className={cn(
                    'absolute top-6 bottom-0 left-[9px] w-px',
                    outcome === 'completed' ? 'bg-emerald-200' : 'bg-ink-200',
                  )}
                  aria-hidden
                />
              )}
              <span className="mt-0.5 shrink-0 [&>svg]:h-4 [&>svg]:w-4">{OUTCOME_ICON[outcome]}</span>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <p className={cn('text-[13px] font-medium', outcome === 'pending' ? 'text-ink-400' : 'text-ink-900')}>
                    {stage.label}
                  </p>
                  <Badge
                    tone={
                      outcome === 'completed'
                        ? 'success'
                        : outcome === 'current'
                          ? 'info'
                          : outcome === 'failed'
                            ? 'danger'
                            : 'neutral'
                    }
                  >
                    {OUTCOME_LABEL[outcome]}
                  </Badge>
                </div>
                <p className="text-ink-500 mt-0.5 text-[11px] leading-relaxed">{stage.description}</p>
                {event && outcome !== 'pending' && (
                  <p className="text-ink-400 mt-1 text-[10px]">
                    {event.actor} · {dateTime(event.timestamp)}
                  </p>
                )}
              </div>
            </li>
          );
        })}
      </ol>
    </Card>
  );
}

/* ------------------------------------------------------------------ */
/* Internal notes                                                      */
/* ------------------------------------------------------------------ */

export function NotesPanel({ record }: { record: EmployerRecord }) {
  const { addNote, deleteNote } = useAppStore();
  const [body, setBody] = useState('');
  const [pinned, setPinned] = useState(false);

  const sorted = [...record.notes].sort(
    (a, b) => Number(b.pinned) - Number(a.pinned) || new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    if (body.trim().length < 3) return;
    addNote(record.employer.id, body.trim(), pinned);
    setBody('');
    setPinned(false);
  };

  return (
    <Card>
      <CardHeader
        title="Internal notes"
        description="Visible to placement staff only. Saved to the shared employer record."
      />

      <form onSubmit={submit} className="flex flex-col gap-2.5">
        <Textarea
          rows={2}
          value={body}
          onChange={(event) => setBody(event.target.value)}
          placeholder="Add an observation, a follow-up, or a reason for the current evaluation…"
          aria-label="New note"
        />
        <div className="flex items-center justify-between gap-3">
          <label className="text-ink-600 flex cursor-pointer items-center gap-2 text-xs">
            <input
              type="checkbox"
              checked={pinned}
              onChange={(event) => setPinned(event.target.checked)}
              className="accent-brand-600 h-3.5 w-3.5"
            />
            Pin this note
          </label>
          <Button type="submit" size="sm" variant="primary" icon={<Plus />} disabled={body.trim().length < 3}>
            Add note
          </Button>
        </div>
      </form>

      <div className="mt-4">
        {sorted.length === 0 ? (
          <EmptyState compact title="No notes yet" description="Notes you add appear here, newest first." />
        ) : (
          <ul className="divide-ink-200 divide-y">
            {sorted.map((note) => (
              <li key={note.id} className="flex items-start gap-3 py-3 first:pt-0">
                <UserAvatar
                  initials={note.author
                    .split(' ')
                    .map((part) => part[0])
                    .slice(0, 2)
                    .join('')}
                  size="sm"
                />
                <div className="min-w-0 flex-1">
                  <p className="text-ink-800 flex items-center gap-2 text-[13px]">
                    <span className="font-semibold">{note.author}</span>
                    {note.pinned && (
                      <Badge tone="warning" icon={<Pin />}>
                        Pinned
                      </Badge>
                    )}
                  </p>
                  <p className="text-ink-600 mt-0.5 text-[13px] leading-relaxed whitespace-pre-wrap">{note.body}</p>
                  <p className="text-ink-400 mt-1 text-[10px]">
                    {relativeTime(note.createdAt)} · {dateTime(note.createdAt)}
                  </p>
                </div>
                <IconButton
                  size="sm"
                  label="Delete note"
                  onClick={() => deleteNote(note.id)}
                  className="hover:bg-rose-50 hover:text-rose-600"
                >
                  <Trash2 />
                </IconButton>
              </li>
            ))}
          </ul>
        )}
      </div>
    </Card>
  );
}
