import React from 'react';
import { Button } from '@/components/ui/button';
import { ProjectCard, ProjectFilters } from '@/components/projects';
import { PageTitle } from '@/components/ui/page-title';
import { EmptyState } from '@/components/ui/empty-state';
import { Plus, FolderOpen, Search } from 'lucide-react';
import type { Project } from '@/types/api';

interface ProjectGridProps {
  // Data
  projects: Project[];
  filteredProjects: Project[];
  
  // Filter state
  searchQuery: string;
  sortBy: string;
  sortOrder: 'asc' | 'desc';
  
  // Filter actions
  onSearchChange: (query: string) => void;
  onSortChange: (sortBy: string, sortOrder: 'asc' | 'desc') => void;
  onClearFilters: () => void;
  
  // Project actions
  onCreateProject: () => void;
  onEditProject: (project: Project) => void;
  onDeleteProject: (project: Project) => void;
  onViewTasks: (project: Project) => void;
  onViewStats: (project: Project) => void;
  onShareProject: (project: Project) => void;
  onNavigateToProject: (project: Project) => void;
}

/**
 * ProjectGrid Component
 * Displays the main grid of projects with filtering and empty states
 */
const ProjectGrid: React.FC<ProjectGridProps> = ({
  projects,
  filteredProjects,
  searchQuery,
  sortBy,
  sortOrder,
  onSearchChange,
  onSortChange,
  onClearFilters,
  onCreateProject,
  onEditProject,
  onDeleteProject,
  onViewTasks,
  onViewStats,
  onShareProject,
  onNavigateToProject,
}) => {
  return (
    <>
      {/* Header Section */}
      <PageTitle
        icon={FolderOpen}
        className="pt-8 pb-2"
        actions={
          <Button 
            onClick={onCreateProject}
            size="lg"
            className="bg-[var(--primary)] hover:bg-[var(--primary-dark)] text-white px-6 py-3 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105"
          >
            <Plus className="h-5 w-5 mr-2" />
            Create New Project
          </Button>
        }
      >
        My Projects
      </PageTitle>

      {/* Stats Cards */}
      {projects.length > 0 && (
        <div className="flex flex-wrap gap-3 mb-6">
          <div className="bg-white/80 backdrop-blur-sm rounded-lg px-3 py-2 border border-[var(--border)]">
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-[var(--text-muted)]"></div>
              <span className="text-sm font-medium text-[var(--text-secondary)]">
                {projects.length} Projects
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      {projects.length > 0 && (
        <div className="mb-6">
          <ProjectFilters
            search={searchQuery}
            onSearchChange={onSearchChange}
            sortBy={sortBy}
            sortOrder={sortOrder}
            onSortChange={onSortChange}
            onClearFilters={onClearFilters}
          />
        </div>
      )}

      {/* Empty States and Project Grid */}
      {projects.length === 0 ? (
        <EmptyState 
          icon={FolderOpen}
          title="No Projects Yet"
          description="Create your first project to start organizing your tasks and boost your productivity."
          action={{
            label: "Create Your First Project",
            onClick: onCreateProject,
            icon: Plus
          }}
          iconSize="lg"
          card
        />
      ) : filteredProjects.length === 0 ? (
        <EmptyState 
          icon={Search}
          title="No Projects Found"
          description={
            searchQuery 
              ? `No projects match "${searchQuery}". Try adjusting your search.`
              : 'No projects match your current filters.'
          }
          action={{
            label: "Clear Filters",
            onClick: onClearFilters
          }}
          iconSize="lg"
          card
        />
      ) : (
        <div className="space-y-4">
          {filteredProjects.map((project) => (
            <ProjectCard
              key={project.id}
              project={project}
              stats={undefined}
              onEdit={onEditProject}
              onDelete={onDeleteProject}
              onViewTasks={onViewTasks}
              onViewStats={onViewStats}
              onShare={onShareProject}
              onNavigateToProject={onNavigateToProject}
            />
          ))}
        </div>
      )}
    </>
  );
};

export default ProjectGrid;
