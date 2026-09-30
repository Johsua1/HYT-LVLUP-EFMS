import { useNavigate } from 'react-router-dom';
import {
  Archive,
  ArchiveRestore,
  Eye,
  Heart,
  MoreVertical,
  Pencil,
  Scale,
  ShieldCheck,
  Trash2,
} from 'lucide-react';
import type { EmployerRecord } from '@/types';
import { IconButton } from '@/components/ui/Button';
import { Dropdown } from '@/components/ui/Dropdown';
import { useAppStore } from '@/store/AppStore';

export interface EmployerActionsProps {
  record: EmployerRecord;
  onEdit: () => void;
  onArchive: () => void;
  onRestore: () => void;
  onDelete: () => void;
}

/**
 * Per-row action menu. Shortlist, comparison and verification are handled here
 * because they are global concerns; archive and delete are delegated so the
 * page owns the confirmation dialogs.
 */
export function EmployerActions({ record, onEdit, onArchive, onRestore, onDelete }: EmployerActionsProps) {
  const navigate = useNavigate();
  const { isShortlisted, toggleShortlist, isComparing, toggleComparison, advanceVerification } = useAppStore();

  const { employer } = record;
  const shortlisted = isShortlisted(employer.id);
  const comparing = isComparing(employer.id);
  const archived = employer.status === 'Archived';

  return (
    <Dropdown
      width={236}
      sections={[
        {
          key: 'primary',
          items: [
            {
              key: 'view',
              label: 'View profile',
              icon: <Eye />,
              onSelect: () => navigate(`/employers/${employer.id}`),
            },
            { key: 'edit', label: 'Edit employer', icon: <Pencil />, onSelect: onEdit },
          ],
        },
        {
          key: 'evaluate',
          label: 'Evaluation',
          items: [
            {
              key: 'shortlist',
              label: shortlisted ? 'Remove from shortlist' : 'Add to shortlist',
              icon: <Heart />,
              tone: shortlisted ? 'danger' : 'default',
              onSelect: () => toggleShortlist(employer.id),
            },
            {
              key: 'compare',
              label: comparing ? 'Remove from comparison' : 'Add to comparison',
              icon: <Scale />,
              tone: comparing ? 'danger' : 'default',
              onSelect: () => toggleComparison(employer.id),
            },
            {
              key: 'verify',
              label: employer.verification === 'Verified' ? 'Verification complete' : 'Advance verification',
              icon: <ShieldCheck />,
              disabled: employer.verification === 'Verified',
              onSelect: () => advanceVerification(employer.id),
            },
          ],
        },
        {
          key: 'danger',
          label: 'Manage',
          items: [
            archived
              ? { key: 'restore', label: 'Restore employer', icon: <ArchiveRestore />, onSelect: onRestore }
              : { key: 'archive', label: 'Archive employer', icon: <Archive />, onSelect: onArchive },
            { key: 'delete', label: 'Delete permanently', icon: <Trash2 />, tone: 'danger', onSelect: onDelete },
          ],
        },
      ]}
      trigger={({ toggle, ref, open }) => (
        <IconButton
          ref={ref}
          label={`Actions for ${employer.companyName}`}
          onClick={toggle}
          active={open}
          className="data-[open=true]:bg-ink-100"
        >
          <MoreVertical />
        </IconButton>
      )}
    />
  );
}
