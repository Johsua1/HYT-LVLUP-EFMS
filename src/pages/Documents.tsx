import { useMemo, useState } from 'react';
import { AlertTriangle, CheckCircle2, FileText, FolderOpen, Plus, Trash2, UploadCloud } from 'lucide-react';
import type { DocumentRecord } from '@/types';
import { DOCUMENT_STATUSES, DOCUMENT_TYPES } from '@/lib/constants';
import { useAppStore } from '@/store/AppStore';
import { usePagination } from '@/hooks/usePagination';
import { useConfirmDialog } from '@/hooks/useConfirmDialog';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Pagination } from '@/components/ui/Pagination';
import { Select } from '@/components/ui/Select';
import { Toolbar, ToolbarGroup } from '@/components/common/Toolbar';
import { StatCard } from '@/components/common/StatCard';
import { DocumentFormModal, DocumentTable } from '@/components/documents/DocumentManager';

/**
 * Document management.
 *
 * Add, edit, delete and re-status documents entirely on the frontend. Selecting
 * a file only reads its name and size — there is no upload endpoint, which is
 * stated plainly in the dialog.
 */
export default function DocumentsPage() {
  const { documents, employers, removeDocument, toast } = useAppStore();
  const { confirm, dialog } = useConfirmDialog();
  const [query, setQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [employerFilter, setEmployerFilter] = useState('');
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<DocumentRecord | null>(null);

  const rows = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return documents
      .filter((document) =>
        needle ? `${document.name} ${document.fileName} ${document.notes}`.toLowerCase().includes(needle) : true,
      )
      .filter((document) => (typeFilter ? document.type === typeFilter : true))
      .filter((document) => (statusFilter ? document.status === statusFilter : true))
      .filter((document) => (employerFilter ? document.employerId === employerFilter : true))
      .sort((a, b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime());
  }, [documents, query, typeFilter, statusFilter, employerFilter]);

  const pagination = usePagination(rows.length, 15);
  const pageRows = pagination.paginate(rows);

  const verified = documents.filter((document) => document.status === 'Verified').length;
  const pending = documents.filter((document) => document.status === 'Pending Review').length;
  const expired = documents.filter((document) => document.status === 'Expired').length;
  const rejected = documents.filter((document) => document.status === 'Rejected').length;

  const handleDelete = async (document: DocumentRecord) => {
    const confirmed = await confirm({
      title: 'Delete document',
      message: `“${document.name}” will be removed from the employer's compliance file.`,
      confirmLabel: 'Delete document',
      destructive: true,
    });
    if (!confirmed) return;
    await removeDocument(document.id);
    toast({ title: 'Document deleted', description: document.name, variant: 'info' });
  };

  const filtersActive = Boolean(query || typeFilter || statusFilter || employerFilter);

  return (
    <>
      <PageHeader
        title="Documents"
        description="Every compliance document held against an employer, with its validity period and review status."
        actions={
          <Button
            variant="primary"
            icon={<Plus />}
            onClick={() => {
              setEditing(null);
              setFormOpen(true);
            }}
          >
            Upload document
          </Button>
        }
      />

      <section className="mb-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="Documents on file" value={documents.length} icon={<FolderOpen />} tone="brand" />
        <StatCard label="Verified" value={verified} icon={<CheckCircle2 />} tone="success" />
        <StatCard label="Awaiting review" value={pending} icon={<FileText />} tone="warning" />
        <StatCard
          label="Expired or rejected"
          value={expired + rejected}
          icon={<AlertTriangle />}
          tone={expired + rejected > 0 ? 'danger' : 'success'}
          hint={`${expired} expired · ${rejected} rejected`}
        />
      </section>

      <Card flush>
        <Toolbar>
          <ToolbarGroup grow>
            <input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search document name or file…"
              aria-label="Search documents"
              className="border-ink-300 text-ink-800 placeholder:text-ink-400 focus:border-brand-500 focus:ring-brand-500/20 h-9 w-full rounded-lg border px-3 text-sm focus:ring-2 focus:outline-none sm:max-w-xs"
            />
            <Select
              aria-label="Filter by document type"
              className="w-full sm:w-44"
              placeholder="All types"
              options={DOCUMENT_TYPES.map((value) => ({ value, label: value }))}
              value={typeFilter}
              onChange={(event) => setTypeFilter(event.target.value)}
            />
            <Select
              aria-label="Filter by document status"
              className="w-full sm:w-40"
              placeholder="All statuses"
              options={DOCUMENT_STATUSES.map((value) => ({ value, label: value }))}
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
            />
            <Select
              aria-label="Filter by employer"
              className="w-full sm:w-52"
              placeholder="All employers"
              options={employers.map((employer) => ({ value: employer.id, label: employer.companyName }))}
              value={employerFilter}
              onChange={(event) => setEmployerFilter(event.target.value)}
            />
            {filtersActive && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setQuery('');
                  setTypeFilter('');
                  setStatusFilter('');
                  setEmployerFilter('');
                }}
              >
                Clear filters
              </Button>
            )}
          </ToolbarGroup>
          <Badge tone="neutral">{rows.length} documents</Badge>
        </Toolbar>

        <DocumentTable
          documents={pageRows}
          showEmployer
          onEdit={(document) => {
            setEditing(document);
            setFormOpen(true);
          }}
          onDelete={handleDelete}
          emptyAction={
            <Button
              variant="primary"
              icon={<UploadCloud />}
              onClick={() => {
                setEditing(null);
                setFormOpen(true);
              }}
            >
              Upload document
            </Button>
          }
        />

        {rows.length > 0 && (
          <Pagination
            page={pagination.page}
            pageSize={pagination.pageSize}
            totalItems={rows.length}
            onPageChange={pagination.setPage}
            onPageSizeChange={pagination.setPageSize}
            itemLabel="documents"
          />
        )}
      </Card>

      {documents.length > 0 && expired > 0 && (
        <div className="border-rose-200 bg-rose-50 mt-4 flex items-start gap-2.5 rounded-lg border px-3.5 py-3">
          <AlertTriangle className="text-rose-600 mt-0.5 h-4 w-4 shrink-0" />
          <div className="text-rose-700 text-xs leading-relaxed">
            <p className="font-semibold">
              {expired} document{expired === 1 ? '' : 's'} {expired === 1 ? 'has' : 'have'} passed their validity date.
            </p>
            <p className="mt-0.5">
              Expired documents are flagged automatically from the expiry date. Request a replacement from the employer
              and update the record once received.
            </p>
          </div>
          <Button
            size="sm"
            variant="danger-outline"
            className="ml-auto shrink-0"
            onClick={() => setStatusFilter('Expired')}
          >
            Show expired
          </Button>
        </div>
      )}

      <DocumentFormModal open={formOpen} onClose={() => setFormOpen(false)} document={editing} />
      {dialog}

      {/* Keeps the delete affordance visible in the empty state too. */}
      {documents.length === 0 && (
        <p className="text-ink-500 mt-3 flex items-center gap-1.5 text-[11px]">
          <Trash2 className="h-3.5 w-3.5" />
          Documents you add are uploaded to Supabase Storage.
        </p>
      )}
    </>
  );
}
