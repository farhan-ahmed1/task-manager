import React from 'react';
import { Button } from '@/components/ui/button';
import { SectionTitle } from '@/components/ui/page-title';
import { ArrowLeft, BarChart3 } from 'lucide-react';
import type { Project } from '@/types/api';

interface ProjectStatsViewProps {
  project: Project;
  onBack: () => void;
}

/**
 * ProjectStatsView Component
 * Displays project statistics and analytics
 * Currently shows a placeholder - to be implemented with real stats
 */
const ProjectStatsView: React.FC<ProjectStatsViewProps> = ({ 
  project, 
  onBack 
}) => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-slate-50">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Header with Back Button */}
        <div className="mb-6">
          <div className="flex items-center space-x-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={onBack}
              className="text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Projects
            </Button>
            <div className="h-4 w-px bg-[var(--border)]" />
            <div>
              <div className="text-xl font-semibold" style={{ color: 'var(--text-primary)' }}>
                {project.name}
              </div>
              <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>Project Analytics</p>
            </div>
          </div>
        </div>

        {/* Stats Content - Placeholder */}
        <div className="text-center py-16 bg-gradient-to-br from-[var(--bg-secondary)] to-[var(--primary-light)] rounded-2xl border border-[var(--border)]">
          <div className="max-w-md mx-auto">
            <BarChart3 className="h-16 w-16 text-[var(--text-muted)] mx-auto mb-4" />
            <SectionTitle className="justify-center mb-2">
              Project Analytics
            </SectionTitle>
            <p style={{ color: 'var(--text-secondary)' }}>
              Stats view will be available soon with React Query
            </p>
          </div>
        </div>

        {/* TODO: Implement actual stats visualization
          - Task completion rate
          - Activity timeline
          - Priority distribution
          - Team member contributions
          - etc.
        */}
      </div>
    </div>
  );
};

export default ProjectStatsView;
