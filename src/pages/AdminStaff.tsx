import { StaffManager } from '@/components/admin/StaffManager';
import { PageHeader } from '@/components/layout/PageHeader';

/** Admin → Staff Management. */
export default function AdminStaffPage() {
  return (
    <>
      <PageHeader
        title="Staff management"
        description="Create and control staff accounts. Administrators invite staff by email; staff set their own password when they accept."
      />
      <StaffManager />
    </>
  );
}
