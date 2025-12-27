import { useState, useMemo } from 'react';
import type { Project } from '@/types/api';

/**
 * Custom hook to manage project filtering and sorting
 * Encapsulates all filter state and computed filtered results
 */
export function useProjectFilters(projects: Project[]) {
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('created_at');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // Memoized filtered and sorted projects
  const filteredAndSortedProjects = useMemo(() => {
    let filtered = projects;

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      filtered = filtered.filter(project => 
        project.name.toLowerCase().includes(query) ||
        (project.description && project.description.toLowerCase().includes(query))
      );
    }

    // Sort projects
    const sorted = [...filtered].sort((a, b) => {
      let comparison = 0;
      
      switch (sortBy) {
        case 'name':
          comparison = a.name.localeCompare(b.name);
          break;
        case 'created_at':
          comparison = new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
          break;
        case 'updated_at':
          comparison = new Date(a.updated_at).getTime() - new Date(b.updated_at).getTime();
          break;
        case 'completion_rate':
          // TODO: Re-implement with React Query stats when available
          comparison = 0;
          break;
        default:
          comparison = new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
      }

      return sortOrder === 'desc' ? -comparison : comparison;
    });

    return sorted;
  }, [projects, searchQuery, sortBy, sortOrder]);

  const handleSortChange = (newSortBy: string, newSortOrder: 'asc' | 'desc') => {
    setSortBy(newSortBy);
    setSortOrder(newSortOrder);
  };

  const handleClearFilters = () => {
    setSearchQuery('');
    setSortBy('created_at');
    setSortOrder('desc');
  };

  const hasActiveFilters = searchQuery.trim() !== '' || 
    sortBy !== 'created_at' || 
    sortOrder !== 'desc';

  return {
    // State
    searchQuery,
    sortBy,
    sortOrder,
    
    // Computed values
    filteredAndSortedProjects,
    hasActiveFilters,
    hasResults: filteredAndSortedProjects.length > 0,
    
    // Actions
    setSearchQuery,
    handleSortChange,
    handleClearFilters,
  };
}
