import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

/**
 * UI State Store
 * 
 * This store ONLY manages UI-specific state, NOT server data.
 * Server data (tasks, projects) is managed by React Query hooks.
 * 
 * Use this store for:
 * - Selected items (for UI highlighting/navigation)
 * - Modal/dialog open states
 * - UI preferences (themes, layout modes, etc.)
 * - Temporary UI flags
 */

interface UIStore {
  // Selected items for UI purposes only
  selectedTaskId: string | null;
  selectedProjectId: string | null;
  
  // UI view modes
  sidebarCollapsed: boolean;
  viewMode: 'list' | 'board' | 'calendar';
  
  // Actions
  setSelectedTaskId: (id: string | null) => void;
  setSelectedProjectId: (id: string | null) => void;
  setSidebarCollapsed: (collapsed: boolean) => void;
  setViewMode: (mode: 'list' | 'board' | 'calendar') => void;
  clearSelection: () => void;
}

export const useUIStore = create<UIStore>()(
  devtools(
    (set) => ({
      selectedTaskId: null,
      selectedProjectId: null,
      sidebarCollapsed: false,
      viewMode: 'list',

      setSelectedTaskId: (id) => set({ selectedTaskId: id }, false, 'setSelectedTaskId'),
      setSelectedProjectId: (id) => set({ selectedProjectId: id }, false, 'setSelectedProjectId'),
      setSidebarCollapsed: (collapsed) => set({ sidebarCollapsed: collapsed }, false, 'setSidebarCollapsed'),
      setViewMode: (mode) => set({ viewMode: mode }, false, 'setViewMode'),
      clearSelection: () => set({ selectedTaskId: null, selectedProjectId: null }, false, 'clearSelection'),
    }),
    {
      name: 'ui-store',
    }
  )
);