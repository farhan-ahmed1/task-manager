import {
  Home,
  Inbox,
  Calendar,
  CalendarDays,
  CheckCircle2,
  Activity,
  FolderOpen,
  Hash,
  Plus,
  Edit,
  Settings,
  Palette,
  Bell,
  User,
  Menu,
  Keyboard,
  Printer,
  Layers,
} from 'lucide-react';
import type { SearchGroup } from '../types/search';

/**
 * Navigation function type for routing
 */
type NavigateFunction = (path: string) => void;

/**
 * Creates search groups with navigation actions
 * @param navigate - Navigation function to handle route changes
 * @returns Array of search groups with items
 */
export const createSearchGroups = (navigate: NavigateFunction): SearchGroup[] => [
  {
    id: 'navigation',
    label: 'Navigation',
    items: [
      {
        id: 'nav-home',
        label: 'Go to home',
        icon: Home,
        action: () => navigate('/dashboard'),
        shortcut: { keys: ['G', 'H'], separator: 'then' },
        keywords: ['home', 'dashboard'],
      },
      {
        id: 'nav-inbox',
        label: 'Go to Inbox',
        icon: Inbox,
        action: () => navigate('/inbox'),
        shortcut: { keys: ['G', 'I'], separator: 'then' },
        keywords: ['inbox', 'tasks'],
      },
      {
        id: 'nav-today',
        label: 'Go to Today',
        icon: Calendar,
        action: () => navigate('/today'),
        shortcut: { keys: ['G', 'T'], separator: 'then' },
        keywords: ['today', 'tasks'],
      },
      {
        id: 'nav-upcoming',
        label: 'Go to Upcoming',
        icon: CalendarDays,
        action: () => navigate('/upcoming'),
        shortcut: { keys: ['G', 'U'], separator: 'then' },
        keywords: ['upcoming', 'future', 'tasks'],
      },
      {
        id: 'nav-completed',
        label: 'Go to Completed',
        icon: CheckCircle2,
        action: () => navigate('/completed'),
        shortcut: { keys: ['G', 'C'], separator: 'then' },
        keywords: ['completed', 'done', 'finished'],
      },
      {
        id: 'nav-activity',
        label: 'Go to activity',
        icon: Activity,
        action: () => navigate('/dashboard'),
        shortcut: { keys: ['G', 'A'], separator: 'then' },
        keywords: ['activity', 'log', 'history'],
      },
      {
        id: 'nav-projects',
        label: 'Open project…',
        icon: FolderOpen,
        action: () => navigate('/projects'),
        shortcut: { keys: ['G', 'P'], separator: 'then' },
        keywords: ['projects', 'list'],
      },
    ],
  },
  {
    id: 'actions',
    label: 'Add',
    items: [
      {
        id: 'action-add-task',
        label: 'Add task',
        icon: Plus,
        action: () => {},
        shortcut: { keys: ['Q'] },
        keywords: ['add', 'new', 'task', 'create'],
      },
      {
        id: 'action-add-project',
        label: 'Add project',
        icon: Hash,
        action: () => {},
        shortcut: { keys: ['⌥', 'P'], separator: '+' },
        keywords: ['add', 'new', 'project', 'create'],
      },
    ],
  },
  {
    id: 'misc',
    label: 'Miscellaneous',
    items: [
      {
        id: 'misc-edit-task',
        label: 'Edit task',
        icon: Edit,
        action: () => {},
        shortcut: { keys: ['⌘', 'E'], separator: '+' },
        keywords: ['edit', 'modify', 'task'],
      },
      {
        id: 'misc-add-section',
        label: 'Add section',
        icon: Layers,
        action: () => {},
        shortcut: { keys: ['S'] },
        keywords: ['add', 'section', 'group'],
      },
      {
        id: 'misc-shortcuts',
        label: 'Show keyboard shortcuts',
        icon: Keyboard,
        action: () => {},
        shortcut: { keys: ['?'] },
        keywords: ['keyboard', 'shortcuts', 'help'],
      },
      {
        id: 'misc-print',
        label: 'Print current view',
        icon: Printer,
        action: () => window.print(),
        shortcut: { keys: ['⌘', 'P'], separator: '+' },
        keywords: ['print', 'export'],
      },
      {
        id: 'misc-sidebar',
        label: 'Open/close sidebar',
        icon: Menu,
        action: () => {}, // Placeholder action
        shortcut: { keys: ['M'] },
        keywords: ['sidebar', 'menu', 'toggle'],
      },
    ],
  },
  {
    id: 'settings',
    label: 'Settings',
    items: [
      {
        id: 'settings-general',
        label: 'General',
        icon: Settings,
        action: () => navigate('/profile'),
        shortcut: { keys: ['O', 'S'], separator: 'then' },
        keywords: ['settings', 'preferences', 'general'],
      },
      {
        id: 'settings-theme',
        label: 'Theme',
        icon: Palette,
        action: () => navigate('/profile'),
        shortcut: { keys: ['O', 'T'], separator: 'then' },
        keywords: ['theme', 'appearance', 'color'],
      },
      {
        id: 'settings-notifications',
        label: 'Notifications',
        icon: Bell,
        action: () => navigate('/profile'),
        keywords: ['notifications', 'alerts'],
      },
      {
        id: 'settings-account',
        label: 'Account',
        icon: User,
        action: () => navigate('/profile'),
        keywords: ['account', 'profile', 'user'],
      },
    ],
  },
];
