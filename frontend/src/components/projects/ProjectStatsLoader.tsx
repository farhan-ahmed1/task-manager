import { useProjectStats } from '@/hooks/useProjects';
import { Loader2 } from 'lucide-react';

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
        <Loader2 className="h-4 w-4 animate-spin text-slate-400" />
      </div>
    );
  }

  if (!stats) {
    return null;
  }

  return <>{children(stats)}</>;
}
