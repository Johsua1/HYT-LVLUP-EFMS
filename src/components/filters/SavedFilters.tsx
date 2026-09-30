import { useState } from 'react';
import { BookmarkPlus, Clock, Trash2, Zap } from 'lucide-react';
import type { FilterPreset, FilterState } from '@/types';
import { countActiveFilters } from '@/lib/filters';
import { cn, dateOnly } from '@/lib/utils';
import { Badge } from '@/components/ui/Badge';
import { Button, IconButton } from '@/components/ui/Button';
import { Input, Textarea } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { Tooltip } from '@/components/ui/Tooltip';

export interface SavedFiltersProps {
  presets: FilterPreset[];
  /** Filter set currently in the workspace — what "save" would capture. */
  currentFilters: FilterState;
  onApply: (preset: FilterPreset) => void;
  onSave: (name: string, description: string) => void;
  onDelete: (preset: FilterPreset) => void;
}

/**
 * Saved filter sets, persisted to localStorage through the store.
 *
 * System presets ship with the demo data; user presets are appended. Both are
 * applied through the same code path, so a preset is nothing more than a stored
 * `FilterState`.
 */
export function SavedFilters({ presets, currentFilters, onApply, onSave, onDelete }: SavedFiltersProps) {
  const [modalOpen, setModalOpen] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [error, setError] = useState('');

  const activeCount = countActiveFilters(currentFilters);

  const openModal = () => {
    setName('');
    setDescription('');
    setError('');
    setModalOpen(true);
  };

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    const trimmed = name.trim();
    if (trimmed.length < 3) {
      setError('Give the filter set a name of at least 3 characters.');
      return;
    }
    if (presets.some((preset) => preset.name.toLowerCase() === trimmed.toLowerCase())) {
      setError('A saved filter with this name already exists.');
      return;
    }
    onSave(trimmed, description.trim());
    setModalOpen(false);
  };

  return (
    <div className="border-ink-200 flex flex-col gap-2 border-b px-3 py-2.5">
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-ink-500 inline-flex items-center gap-1.5 text-[11px] font-semibold tracking-wide uppercase">
          <Zap className="h-3.5 w-3.5" />
          Saved filters
        </span>

        <div className="no-scrollbar -mx-1 flex min-w-0 flex-1 gap-1.5 overflow-x-auto px-1 py-0.5">
          {presets.length === 0 && (
            <span className="text-ink-500 text-xs">No saved filter sets yet.</span>
          )}
          {presets.map((preset) => (
            <span
              key={preset.id}
              className={cn(
                'group border-ink-200 hover:border-brand-300 inline-flex shrink-0 items-center gap-1 rounded-md border bg-white py-0.5 pr-1 pl-2 text-[11px] font-medium transition-colors',
              )}
            >
              <button
                type="button"
                onClick={() => onApply(preset)}
                title={preset.description || preset.name}
                className="text-ink-700 hover:text-brand-700 flex max-w-52 items-center gap-1.5"
              >
                <span className="truncate">{preset.name}</span>
                {preset.system && <Badge tone="neutral">preset</Badge>}
              </button>
              <Tooltip
                content={
                  preset.lastUsedAt
                    ? `Last used ${dateOnly(preset.lastUsedAt)} · ${preset.useCount} use${preset.useCount === 1 ? '' : 's'}`
                    : 'Never used'
                }
              >
                <span className="text-ink-400 inline-flex items-center gap-0.5 text-[10px]">
                  <Clock className="h-2.5 w-2.5" />
                  {preset.useCount}
                </span>
              </Tooltip>
              <IconButton
                size="sm"
                label={`Delete saved filter ${preset.name}`}
                onClick={() => onDelete(preset)}
                className="text-ink-400 hover:bg-rose-50 hover:text-rose-600 h-5 w-5"
              >
                <Trash2 className="h-3 w-3" />
              </IconButton>
            </span>
          ))}
        </div>

        <Button
          size="sm"
          variant="outline"
          icon={<BookmarkPlus />}
          onClick={openModal}
          disabled={activeCount === 0}
          title={
            activeCount === 0
              ? 'Add at least one filter criterion before saving'
              : 'Save the current criteria as a reusable filter set'
          }
          className="shrink-0"
        >
          Save current filters
        </Button>
      </div>

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        size="sm"
        title="Save filter set"
        description={`${activeCount} active criteria will be stored in this browser.`}
        footer={
          <>
            <Button variant="outline" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" form="save-filter-form" variant="primary">
              Save filter
            </Button>
          </>
        }
      >
        <form id="save-filter-form" onSubmit={submit} className="flex flex-col gap-3.5" noValidate>
          <Input
            label="Filter name *"
            name="preset-name"
            data-autofocus
            value={name}
            onChange={(event) => {
              setName(event.target.value);
              setError('');
            }}
            error={error}
            placeholder="e.g. Japan High Salary"
          />
          <Textarea
            label="Description"
            name="preset-description"
            rows={2}
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            placeholder="What this filter set is for"
          />
        </form>
      </Modal>
    </div>
  );
}
