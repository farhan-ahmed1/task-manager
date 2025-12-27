import { useProjectStats } from '@/hooks/useProjects';
import { Spinner } from '@/components/ui/spinner';

interface ProjectStatsLoaderProps {
  projectId: string;
  children: (stats: { PENDING: number; IN_PROGRESS: number; COMPLETED: number }) => React.ReactNode;
}

/**
 * Component that loads project stats using React Query and renders children with the data
 */
export function ProjectStatsLoader({ projectId, children }: ProjectStatsLoaderProps) {
  const { data: stats, isLoading } = useProjectStats(projectId);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-4">
        <Spinner size="sm" className="text-[var(--text-muted)]" />
      </div>
    );
  }

  if (!stats) {
    return null;
  }

  return <>{children(stats)}</>;
}
