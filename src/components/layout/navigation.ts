import {
  BarChart3,
  Bell,
  Building2,
  FileSignature,
  FolderOpen,
  Heart,
  History,
  LayoutDashboard,
  ListChecks,
  Receipt,
  Scale,
  Settings,
  ShieldCheck,
  SlidersHorizontal,
  UserCog,
  type LucideIcon,
} from 'lucide-react';

export interface NavItem {
  to: string;
  label: string;
  icon: LucideIcon;
  /** Which live counter, if any, is rendered next to the label. */
  badge?: 'shortlist' | 'notifications';
  description: string;
}

export interface NavSection {
  id: string;
  label: string;
  items: NavItem[];
  /** Only rendered for administrators (and only after MFA). */
  adminOnly?: boolean;
}

/**
 * Sidebar information architecture.
 *
 * Order mirrors the placement officer's actual workflow: overview → employer
 * database → filtering and evaluation → compliance paperwork → system tools.
 */
export const NAV_SECTIONS: NavSection[] = [
  {
    id: 'administration',
    label: 'Administration',
    adminOnly: true,
    items: [
      {
        to: '/admin/dashboard',
        label: 'Admin Dashboard',
        icon: ShieldCheck,
        description: 'Team and security overview for administrators.',
      },
      {
        to: '/admin/staff',
        label: 'Staff Management',
        icon: UserCog,
        description: 'Invite staff, edit details, and control account access.',
      },
      {
        to: '/admin/activity',
        label: 'Activity Log',
        icon: History,
        description: 'Attributed audit trail of every action taken in the workspace.',
      },
      {
        to: '/admin/settings',
        label: 'Admin Settings',
        icon: Settings,
        description: 'Administrator account and two-factor settings.',
      },
    ],
  },
  {
    id: 'overview',
    label: 'Overview',
    items: [
      {
        to: '/dashboard',
        label: 'Dashboard',
        icon: LayoutDashboard,
        description: 'Portfolio health, contracts and requirement coverage at a glance.',
      },
    ],
  },
  {
    id: 'employers',
    label: 'Employers',
    items: [
      {
        to: '/employers',
        label: 'Employers',
        icon: Building2,
        description: 'Search, sort and manage the full employer database.',
      },
      {
        to: '/filter',
        label: 'Employer Filtering',
        icon: SlidersHorizontal,
        description: 'Combine country, salary, fee and benefit criteria to shortlist candidates.',
      },
      {
        to: '/compare',
        label: 'Compare Employers',
        icon: Scale,
        description: 'Evaluate two to four employers side by side.',
      },
      {
        to: '/shortlist',
        label: 'Shortlist',
        icon: Heart,
        badge: 'shortlist',
        description: 'Employers earmarked for the next deployment batch.',
      },
    ],
  },
  {
    id: 'compliance',
    label: 'Compliance',
    items: [
      { to: '/fees', label: 'Fees', icon: Receipt, description: 'Fee schedules and total deployment cost.' },
      {
        to: '/contracts',
        label: 'Contracts',
        icon: FileSignature,
        description: 'Contract terms, expiry monitoring and renewals.',
      },
      {
        to: '/requirements',
        label: 'Requirements',
        icon: ListChecks,
        description: 'Documentation checklist and completion tracking.',
      },
      {
        to: '/documents',
        label: 'Documents',
        icon: FolderOpen,
        description: 'Uploaded employer documents and validity.',
      },
    ],
  },
  {
    id: 'workspace',
    label: 'Workspace',
    items: [
      {
        to: '/notifications',
        label: 'Notifications',
        icon: Bell,
        badge: 'notifications',
        description: 'Contract, document and verification alerts.',
      },
      { to: '/reports', label: 'Reports', icon: BarChart3, description: 'Portfolio analytics and distribution charts.' },
      { to: '/settings', label: 'Settings', icon: Settings, description: 'Appearance, display and account preferences.' },
    ],
  },
];

export const NAV_ITEMS: NavItem[] = NAV_SECTIONS.flatMap((section) => section.items);

/** Resolves the nav entry owning a pathname, so nested routes stay highlighted. */
export function findNavItem(pathname: string): NavItem | undefined {
  const matches = NAV_ITEMS.filter(
    (item) => pathname === item.to || pathname.startsWith(`${item.to}/`),
  );
  return matches.sort((a, b) => b.to.length - a.to.length)[0];
}
