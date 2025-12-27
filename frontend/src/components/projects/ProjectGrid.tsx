import React from 'react';
import { Button } from '@/components/ui/button';
import { ProjectCard, ProjectFilters } from '@/components/projects';
import { PageTitle } from '@/components/ui/page-title';
import { Plus, FolderOpen } from 'lucide-react';
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
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105"
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
          <div className="bg-white/80 backdrop-blur-sm rounded-lg px-3 py-2 border border-slate-200/60">
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-slate-400"></div>
              <span className="text-sm font-medium text-slate-700">
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
          title="No Projects Yet"
          description="Create your first project to start organizing your tasks and boost your productivity."
          buttonText="Create Your First Project"
          onAction={onCreateProject}
          icon={<FolderOpen className="mx-auto h-16 w-16" />}
        />
      ) : filteredProjects.length === 0 ? (
        <EmptyState 
          title="No Projects Found"
          description={
            searchQuery 
              ? `No projects match "${searchQuery}". Try adjusting your search.`
              : 'No projects match your current filters.'
          }
          buttonText="Clear Filters"
          onAction={onClearFilters}
          icon={
            <svg className="mx-auto h-16 w-16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          }
          variant="outline"
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

interface EmptyStateProps {
  title: string;
  description: string;
  buttonText: string;
  onAction: () => void;
  icon: React.ReactNode;
  variant?: 'default' | 'outline';
}

const EmptyState: React.FC<EmptyStateProps> = ({
  title,
  description,
  buttonText,
  onAction,
  icon,
  variant = 'default',
}) => {
  return (
    <div className="text-center py-16 bg-gradient-to-br from-slate-50 to-blue-50 rounded-2xl border border-slate-200/60">
      <div className="max-w-md mx-auto">
        <div className="text-slate-400 mb-6">
          {icon}
        </div>
        <h3 className="text-xl font-semibold text-slate-900 mb-2">{title}</h3>
        <p className="text-slate-600 mb-6">{description}</p>
        <Button 
          onClick={onAction}
          size="lg"
          variant={variant}
          className={
            variant === 'default'
              ? 'bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105'
              : 'border-slate-300 text-slate-700 hover:bg-slate-50 px-6 py-3 rounded-xl'
          }
        >
          {variant === 'default' && <Plus className="h-5 w-5 mr-2" />}
          {buttonText}
        </Button>
      </div>
    </div>
  );
};

export default ProjectGrid;
