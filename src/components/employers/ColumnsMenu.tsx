import { Columns3, Lock, RotateCcw } from 'lucide-react';
import type { TableColumn } from '@/types';
import { Popover } from '@/components/ui/Popover';
import { Checkbox } from '@/components/ui/Checkbox';
import { Button } from '@/components/ui/Button';

export interface ColumnsMenuProps<T> {
  columns: TableColumn<T>[];
  visible: string[];
  onChange: (visible: string[]) => void;
  onReset: () => void;
}

/**
 * Column visibility picker. Locked columns (company, actions) cannot be hidden
 * because the table would stop being navigable without them.
 */
export function ColumnsMenu<T>({ columns, visible, onChange, onReset }: ColumnsMenuProps<T>) {
  const toggle = (key: string) =>
    onChange(visible.includes(key) ? visible.filter((entry) => entry !== key) : [...visible, key]);

  return (
    <Popover
      align="end"
      width={248}
      trigger={({ toggle: toggleOpen, ref, open }) => (
        <Button
          ref={ref}
          variant="outline"
          size="sm"
          icon={<Columns3 />}
          onClick={toggleOpen}
          aria-expanded={open}
          title="Choose which columns are shown"
        >
          Columns
        </Button>
      )}
    >
      <div className="flex flex-col">
        <div className="border-ink-200 flex items-center justify-between border-b px-3 py-2">
          <p className="text-ink-800 text-[12px] font-semibold">Visible columns</p>
          <button
            type="button"
            onClick={onReset}
            className="text-brand-700 hover:bg-brand-50 inline-flex items-center gap-1 rounded px-1.5 py-1 text-[11px] font-medium"
          >
            <RotateCcw className="h-3 w-3" />
            Reset
          </button>
        </div>
        <div className="flex max-h-72 flex-col gap-1.5 overflow-y-auto p-3">
          {columns.map((column) => (
            <Checkbox
              key={column.key}
              label={
                <span className="flex items-center gap-1.5">
                  <span>{column.header}</span>
                  {column.locked && (
                    <span title="Always visible">
                      <Lock className="text-ink-400 h-3 w-3" />
                    </span>
                  )}
                </span>
              }
              checked={column.locked || visible.includes(column.key)}
              disabled={column.locked}
              onChange={() => toggle(column.key)}
            />
          ))}
        </div>
      </div>
    </Popover>
  );
}
