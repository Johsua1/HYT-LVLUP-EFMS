import { useEffect, useMemo, useRef, useState } from 'react';
import { AlertTriangle, Download, FileText, Paperclip, Trash2, Upload, UploadCloud, X } from 'lucide-react';
import type { DocumentRecord, DocumentStatus, TableColumn } from '@/types';
import { DOCUMENT_STATUSES, DOCUMENT_TYPES } from '@/lib/constants';
import { cn, dateOnly, fileNameMatchesDocument, formatFileSize } from '@/lib/utils';
import { useAppStore } from '@/store/AppStore';
import { useAuth } from '@/auth/AuthProvider';
import { createDocumentSignedUrl } from '@/lib/supabase';
import { DataTable } from '@/components/common/DataTable';
import { DocumentStatusBadge } from '@/components/common/StatusBadge';
import { DateText } from '@/components/common/ValueText';
import { Button, IconButton } from '@/components/ui/Button';
import { Input, Textarea } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { Select } from '@/components/ui/Select';
import { Badge } from '@/components/ui/Badge';
import { Tooltip } from '@/components/ui/Tooltip';
import { EmptyState } from '@/components/ui/EmptyState';

/* ------------------------------------------------------------------ */
/* Helpers                                                             */
/* ------------------------------------------------------------------ */

const toDateInput = (iso: string | null): string => (iso ? iso.slice(0, 10) : '');
const fromDateInput = (value: string): string | null =>
  value ? new Date(`${value}T00:00:00Z`).toISOString() : null;

/* ------------------------------------------------------------------ */
/* Table                                                               */
/* ------------------------------------------------------------------ */

export interface DocumentTableProps {
  documents: DocumentRecord[];
  /** Shows the owning employer column — used by the standalone Documents page. */
  showEmployer?: boolean;
  onEdit: (document: DocumentRecord) => void;
  onDelete: (document: DocumentRecord) => void;
  emptyAction?: React.ReactNode;
}

export function DocumentTable({
  documents,
  showEmployer = false,
  onEdit,
  onDelete,
  emptyAction,
}: DocumentTableProps) {
  const { employers, setDocumentStatus, toast } = useAppStore();

  const employerName = (id: string) => employers.find((employer) => employer.id === id)?.companyName ?? '—';

  const openDocument = async (document: DocumentRecord) => {
    if (!document.storagePath) {
      toast({
        title: 'No file attached',
        description: 'This document record has no uploaded file — only metadata was saved.',
        variant: 'info',
      });
      return;
    }
    const { url, error } = await createDocumentSignedUrl(document.storagePath, 120);
    if (error || !url) {
      toast({ title: 'Could not open file', description: error ?? 'Unknown error.', variant: 'error' });
      return;
    }
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const columns = useMemo<TableColumn<DocumentRecord>[]>(() => {
    const base: TableColumn<DocumentRecord>[] = [
      {
        key: 'name',
        header: 'Document',
        sortable: true,
        sortValue: (document) => document.name,
        render: (document) => (
          <div className="flex min-w-0 items-center gap-2.5">
            <span className="bg-ink-100 text-ink-500 flex h-8 w-8 shrink-0 items-center justify-center rounded-md">
              <FileText className="h-4 w-4" />
            </span>
            <div className="min-w-0">
              <p className="text-ink-900 truncate text-[13px] font-medium">{document.name}</p>
              <p className="text-ink-500 truncate text-[11px]">{document.fileName}</p>
            </div>
          </div>
        ),
      },
      {
        key: 'type',
        header: 'Type',
        sortable: true,
        sortValue: (document) => document.type,
        render: (document) => <Badge tone="neutral">{document.type}</Badge>,
      },
    ];

    if (showEmployer) {
      base.push({
        key: 'employer',
        header: 'Employer',
        sortable: true,
        sortValue: (document) => employerName(document.employerId),
        render: (document) => <span className="text-ink-700 text-[13px]">{employerName(document.employerId)}</span>,
      });
    }

    base.push(
      {
        key: 'uploaded',
        header: 'Uploaded',
        sortable: true,
        sortValue: (document) => document.uploadedAt,
        render: (document) => (
          <div>
            <DateText iso={document.uploadedAt} className="text-ink-700" />
            <p className="text-ink-500 text-[10px]">
              {document.uploadedBy} · {formatFileSize(document.fileSizeKb)}
            </p>
          </div>
        ),
      },
      {
        key: 'expires',
        header: 'Expires',
        sortable: true,
        sortValue: (document) => document.expiresAt ?? '',
        render: (document) =>
          document.expiresAt ? (
            <DateText iso={document.expiresAt} className="text-ink-700" />
          ) : (
            <span className="text-ink-400 text-xs">No expiry</span>
          ),
      },
      {
        key: 'status',
        header: 'Status',
        sortable: true,
        sortValue: (document) => document.status,
        render: (document) => (
          <div className="flex items-center gap-2">
            <DocumentStatusBadge status={document.status} />
            <Select
              aria-label={`${document.name} status`}
              className="h-8 w-36 text-[12px]"
              options={DOCUMENT_STATUSES.map((value) => ({ value, label: value }))}
              value={document.status}
              onChange={(event) =>
                setDocumentStatus(document.id, event.target.value as DocumentStatus)
              }
            />
          </div>
        ),
      },
      {
        key: 'actions',
        header: 'Actions',
        locked: true,
        align: 'right',
        width: '6rem',
        render: (document) => (
          <div className="flex items-center justify-end gap-1">
            <Tooltip content={document.storagePath ? 'Open file' : 'No file attached'}>
              <IconButton
                size="sm"
                label={`Open ${document.name}`}
                disabled={!document.storagePath}
                onClick={() => void openDocument(document)}
              >
                <Download />
              </IconButton>
            </Tooltip>
            <Tooltip content="Edit document">
              <IconButton size="sm" label={`Edit ${document.name}`} onClick={() => onEdit(document)}>
                <Paperclip />
              </IconButton>
            </Tooltip>
            <Tooltip content="Delete document">
              <IconButton
                size="sm"
                label={`Delete ${document.name}`}
                onClick={() => onDelete(document)}
                className="hover:bg-rose-50 hover:text-rose-600"
              >
                <Trash2 />
              </IconButton>
            </Tooltip>
          </div>
        ),
      },
    );

    return base;
  }, [showEmployer, employers, setDocumentStatus, onEdit, onDelete, toast]);

  const renderMobileCard = (document: DocumentRecord) => (
    <div className="border-ink-200 shadow-card rounded-card border bg-white p-4">
      <div className="flex items-start gap-2.5">
        <span className="bg-ink-100 text-ink-500 flex h-8 w-8 shrink-0 items-center justify-center rounded-md">
          <FileText className="h-4 w-4" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-ink-900 truncate text-[13px] font-semibold">{document.name}</p>
          <p className="text-ink-500 truncate text-[11px]">{document.fileName}</p>
        </div>
        <DocumentStatusBadge status={document.status} />
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-1.5">
        <Badge tone="neutral">{document.type}</Badge>
        {showEmployer && <Badge tone="info">{employerName(document.employerId)}</Badge>}
      </div>

      <dl className="border-ink-200 mt-3 grid grid-cols-2 gap-x-4 gap-y-3 border-t pt-3">
        <div className="min-w-0">
          <dt className="text-ink-500 text-[10px] font-semibold tracking-wide uppercase">Uploaded</dt>
          <dd className="mt-0.5">
            <DateText iso={document.uploadedAt} className="text-ink-700" />
            <p className="text-ink-500 text-[10px]">
              {document.uploadedBy} · {formatFileSize(document.fileSizeKb)}
            </p>
          </dd>
        </div>
        <div className="min-w-0">
          <dt className="text-ink-500 text-[10px] font-semibold tracking-wide uppercase">Expires</dt>
          <dd className="mt-0.5">
            {document.expiresAt ? (
              <DateText iso={document.expiresAt} className="text-ink-700" />
            ) : (
              <span className="text-ink-400 text-xs">No expiry</span>
            )}
          </dd>
        </div>
      </dl>

      <div className="border-ink-200 mt-3 flex flex-wrap items-center justify-between gap-2 border-t pt-3">
        <Select
          aria-label={`${document.name} status`}
          className="h-8 w-full text-[12px] sm:w-36"
          options={DOCUMENT_STATUSES.map((value) => ({ value, label: value }))}
          value={document.status}
          onChange={(event) => setDocumentStatus(document.id, event.target.value as DocumentStatus)}
        />
        <div className="flex items-center gap-1">
          <Tooltip content={document.storagePath ? 'Open file' : 'No file attached'}>
            <IconButton
              size="sm"
              label={`Open ${document.name}`}
              disabled={!document.storagePath}
              onClick={() => void openDocument(document)}
            >
              <Download />
            </IconButton>
          </Tooltip>
          <Tooltip content="Edit document">
            <IconButton size="sm" label={`Edit ${document.name}`} onClick={() => onEdit(document)}>
              <Paperclip />
            </IconButton>
          </Tooltip>
          <Tooltip content="Delete document">
            <IconButton
              size="sm"
              label={`Delete ${document.name}`}
              onClick={() => onDelete(document)}
              className="hover:bg-rose-50 hover:text-rose-600"
            >
              <Trash2 />
            </IconButton>
          </Tooltip>
        </div>
      </div>
    </div>
  );

  return (
    <DataTable
      columns={columns}
      rows={documents}
      rowKey={(document) => document.id}
      renderMobileCard={renderMobileCard}
      empty={
        <EmptyState
          variant="documents"
          title="No documents yet"
          description="Upload business registration, job orders, contracts and insurance certificates to build the compliance file."
          action={emptyAction}
        />
      }
    />
  );
}

/* ------------------------------------------------------------------ */
/* Form                                                                */
/* ------------------------------------------------------------------ */

export interface DocumentFormModalProps {
  open: boolean;
  onClose: () => void;
  /** Fixed employer when opened from an employer profile. */
  employerId?: string;
  document?: DocumentRecord | null;
}

interface DocumentDraft {
  name: string;
  type: string;
  employerId: string;
  status: DocumentStatus;
  expiresAt: string;
  notes: string;
  fileName: string;
  fileSizeKb: number;
}

/**
 * Add / edit document dialog.
 *
 * When a file is chosen it is uploaded to the private Supabase Storage
 * `documents` bucket and the record stores its path; without a file only the
 * metadata row is written (useful for logging a document that lives offline).
 */
export function DocumentFormModal({ open, onClose, employerId, document }: DocumentFormModalProps) {
  const { employers, records, addDocument, updateDocument, uploadDocument, replaceDocumentFile, toast } =
    useAppStore();
  const { profile } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);

  const [draft, setDraft] = useState<DocumentDraft>({
    name: '',
    type: 'Contract',
    employerId: employerId ?? employers[0]?.id ?? '',
    status: 'Pending Review',
    expiresAt: '',
    notes: '',
    fileName: '',
    fileSizeKb: 0,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!open) return;
    setErrors({});
    setFile(null);
    if (document) {
      setDraft({
        name: document.name,
        type: document.type,
        employerId: document.employerId,
        status: document.status,
        expiresAt: toDateInput(document.expiresAt),
        notes: document.notes,
        fileName: document.fileName,
        fileSizeKb: document.fileSizeKb,
      });
    } else {
      setDraft({
        name: '',
        type: 'Contract',
        employerId: employerId ?? employers[0]?.id ?? '',
        status: 'Pending Review',
        expiresAt: '',
        notes: '',
        fileName: '',
        fileSizeKb: 0,
      });
    }
  }, [open, document, employerId, employers]);

  /* A document is uploaded to satisfy one of the employer's checklist items,
     so those labels are the name suggestions and the chosen one explains
     what the file should contain. */
  const requirements = useMemo(
    () => records.find((record) => record.employer.id === draft.employerId)?.requirements ?? [],
    [records, draft.employerId],
  );

  const matchedRequirement = useMemo(() => {
    const typed = draft.name.trim().toLowerCase();
    return requirements.find((item) => item.label.toLowerCase() === typed) ?? null;
  }, [requirements, draft.name]);

  /* Advisory only: a file whose name shares nothing with the document name is
     probably the wrong attachment, but the user knows best and may continue. */
  const fileMismatch =
    Boolean(draft.fileName) &&
    Boolean(draft.name.trim()) &&
    !fileNameMatchesDocument(draft.fileName, draft.name);

  const handleFile = (selected: File | undefined) => {
    if (!selected) return;
    setFile(selected);
    /* The name is not derived from the file: it must name one of the
       employer's requirements, so that the two can be checked against each
       other instead of always agreeing by construction. */
    setDraft((current) => ({
      ...current,
      fileName: selected.name,
      fileSizeKb: Math.max(1, Math.round(selected.size / 1024)),
    }));
  };

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();

    const nextErrors: Record<string, string> = {};
    if (!draft.name.trim()) nextErrors.name = 'Give the document a name.';
    if (!draft.employerId) nextErrors.employerId = 'Select the employer this document belongs to.';
    if (Object.keys(nextErrors).length) {
      setErrors(nextErrors);
      toast({ title: 'Document not saved', description: 'Fix the highlighted fields.', variant: 'error' });
      return;
    }

    const uploadedBy = profile?.full_name || profile?.email || 'Unknown user';
    const name = draft.name.trim();
    const expiresAt = fromDateInput(draft.expiresAt);

    setBusy(true);
    try {
      if (document) {
        /* Editing an existing record — swap the file only if a new one was picked. */
        if (file) {
          const { error } = await replaceDocumentFile(document.id, file);
          if (error) {
            toast({ title: 'File upload failed', description: error, variant: 'error' });
            return;
          }
        }
        await updateDocument(document.id, {
          name,
          type: draft.type,
          status: draft.status,
          expiresAt,
          notes: draft.notes.trim(),
        });
        toast({ title: 'Document updated', description: name, variant: 'success' });
      } else if (file) {
        const { error } = await uploadDocument(draft.employerId, file, {
          name,
          type: draft.type,
          status: draft.status,
          expiresAt,
          notes: draft.notes.trim(),
        });
        if (error) {
          toast({ title: 'File upload failed', description: error, variant: 'error' });
          return;
        }
        toast({
          title: 'Document uploaded',
          description: `${name} was attached to ${employers.find((e) => e.id === draft.employerId)?.companyName ?? 'the employer'}.`,
          variant: 'success',
        });
      } else {
        await addDocument(draft.employerId, {
          name,
          type: draft.type,
          fileName: draft.fileName || `${name.toLowerCase().replace(/\s+/g, '-')}.pdf`,
          fileSizeKb: draft.fileSizeKb || 240,
          uploadedAt: new Date().toISOString(),
          uploadedBy,
          expiresAt,
          status: draft.status,
          notes: draft.notes.trim(),
        });
        toast({
          title: 'Document added',
          description: `${name} was attached to ${employers.find((e) => e.id === draft.employerId)?.companyName ?? 'the employer'}.`,
          variant: 'success',
        });
      }
      onClose();
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      size="md"
      icon={<UploadCloud />}
      title={document ? `Edit ${document.name}` : 'Upload document'}
      description={
        document
          ? 'Update the document record and its validity. Choose a new file to replace the stored copy.'
          : 'Attach a compliance document to an employer. Files are uploaded securely to Supabase Storage.'
      }
      footer={
        <>
          <Button variant="outline" onClick={onClose} disabled={busy}>
            Cancel
          </Button>
          <Button type="submit" form="document-form" variant="primary" icon={<Upload />} loading={busy}>
            {document ? 'Save document' : 'Add document'}
          </Button>
        </>
      }
    >
      <form id="document-form" onSubmit={submit} className="flex flex-col gap-3.5" noValidate>
        {/* File picker */}
        <div>
          <span className="text-ink-700 mb-1.5 block text-xs font-medium">File</span>
          <div
            className={cn(
              'border-ink-300 hover:border-brand-400 flex flex-col items-center justify-center gap-2 rounded-lg border border-dashed px-4 py-5 text-center transition-colors',
              draft.fileName && 'border-brand-300 bg-brand-50/40',
            )}
          >
            <input
              ref={fileInputRef}
              type="file"
              className="sr-only"
              onChange={(event) => handleFile(event.target.files?.[0])}
              accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.xlsx"
            />
            {draft.fileName ? (
              <>
                <FileText className="text-brand-600 h-5 w-5" />
                <p className="text-ink-800 text-[13px] font-medium">{draft.fileName}</p>
                <p className="text-ink-500 text-[11px]">{formatFileSize(draft.fileSizeKb)} selected</p>
                <div className="mt-1 flex items-center gap-2">
                  <Button size="xs" variant="outline" onClick={() => fileInputRef.current?.click()}>
                    Replace file
                  </Button>
                  <Button
                    size="xs"
                    variant="ghost"
                    icon={<X />}
                    onClick={() => {
                      setFile(null);
                      setDraft((current) => ({ ...current, fileName: '', fileSizeKb: 0 }));
                    }}
                  >
                    Remove
                  </Button>
                </div>
              </>
            ) : (
              <>
                <UploadCloud className="text-ink-400 h-5 w-5" />
                <p className="text-ink-600 text-[13px]">Select a file from this device</p>
                <p className="text-ink-500 text-[11px]">PDF, DOCX, XLSX, JPG, PNG or WEBP · up to 10 MB</p>
                <Button size="xs" variant="outline" onClick={() => fileInputRef.current?.click()}>
                  Choose file
                </Button>
              </>
            )}
          </div>

          {fileMismatch && (
            <p className="mt-2 flex items-start gap-1.5 text-[11px] leading-relaxed text-amber-700">
              <AlertTriangle className="mt-0.5 h-3 w-3 shrink-0" />
              <span>
                “{draft.fileName}” doesn’t mention “{draft.name.trim()}”. Double-check that this is the
                right file — you can still add it.
              </span>
            </p>
          )}
        </div>

        <Input
          label="Document name *"
          name="doc-name"
          list="document-name-options"
          data-autofocus
          value={draft.name}
          onChange={(event) => {
            setDraft((current) => ({ ...current, name: event.target.value }));
            setErrors((current) => ({ ...current, name: '' }));
          }}
          error={errors.name}
          hint={
            matchedRequirement
              ? matchedRequirement.description
              : 'Pick one of this employer’s requirements, or type a name of your own.'
          }
          placeholder="e.g. Business Registration Certificate"
        />
        <datalist id="document-name-options">
          {requirements.map((item) => (
            <option key={item.id} value={item.label} />
          ))}
        </datalist>

        <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
          <Select
            label="Document type"
            name="doc-type"
            options={DOCUMENT_TYPES.map((value) => ({ value, label: value }))}
            value={draft.type}
            onChange={(event) => setDraft((current) => ({ ...current, type: event.target.value }))}
          />
          <Select
            label="Status"
            name="doc-status"
            options={DOCUMENT_STATUSES.map((value) => ({ value, label: value }))}
            value={draft.status}
            onChange={(event) =>
              setDraft((current) => ({ ...current, status: event.target.value as DocumentStatus }))
            }
          />
        </div>

        <Select
          label="Employer *"
          name="doc-employer"
          options={employers.map((employer) => ({ value: employer.id, label: employer.companyName }))}
          value={draft.employerId}
          onChange={(event) => {
            setDraft((current) => ({ ...current, employerId: event.target.value }));
            setErrors((current) => ({ ...current, employerId: '' }));
          }}
          error={errors.employerId}
          disabled={Boolean(employerId)}
        />

        <Input
          label="Expiry date"
          name="doc-expiry"
          type="date"
          value={draft.expiresAt}
          onChange={(event) => setDraft((current) => ({ ...current, expiresAt: event.target.value }))}
          hint="Leave blank for documents without a validity period."
        />

        <Textarea
          label="Notes"
          name="doc-notes"
          rows={2}
          value={draft.notes}
          onChange={(event) => setDraft((current) => ({ ...current, notes: event.target.value }))}
          placeholder="Review findings, corrections requested, or the issuing authority."
        />

        {document && (
          <p className="text-ink-500 text-[11px]">
            Originally uploaded {dateOnly(document.uploadedAt)} by {document.uploadedBy}.
          </p>
        )}
      </form>
    </Modal>
  );
}
