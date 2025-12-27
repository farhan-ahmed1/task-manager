import React from 'react';
import type { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

interface EmptyStateProps {
  /**
   * Icon to display at the top
   */
  icon?: LucideIcon;
  /**
   * Main heading text
   */
  title: string;
  /**
   * Description or explanation text
   */
  description?: string;
  /**
   * Optional action button
   */
  action?: {
    label: string;
    onClick: () => void;
    icon?: LucideIcon;
  };
  /**
   * Additional CSS classes for the container
   */
  className?: string;
  /**
   * Icon size variant
   * @default 'md'
   */
  iconSize?: 'sm' | 'md' | 'lg';
  /**
   * Whether to show a background card
   * @default false
   */
  card?: boolean;
}

const iconSizeClasses = {
  sm: 'w-12 h-12',
  md: 'w-16 h-16',
  lg: 'w-20 h-20',
};

const iconWrapperSizeClasses = {
  sm: 'w-12 h-12',
  md: 'w-16 h-16',
  lg: 'w-20 h-20',
};

/**
 * Consistent empty state component for displaying "no data" scenarios
 * 
 * @example
 * // Basic empty state
 * <EmptyState
 *   icon={Calendar}
 *   title="No tasks due today"
 *   description="Add tasks with today's date to see them here."
 * />
 * 
 * @example
 * // With action button
 * <EmptyState
 *   icon={FolderOpen}
 *   title="No projects yet"
 *   description="Create your first project to get started."
 *   action={{
 *     label: "Create Project",
 *     onClick: () => setShowModal(true),
 *     icon: Plus
 *   }}
 * />
 * 
 * @example
 * // With card background
 * <EmptyState
 *   icon={CheckCircle}
 *   title="No completed tasks"
 *   description="Tasks you complete will appear here."
 *   card
 * />
 */
export const EmptyState: React.FC<EmptyStateProps> = ({
  icon: Icon,
  title,
  description,
  action,
  className,
  iconSize = 'md',
  card = false,
}) => {
  const content = (
    <div 
      className={cn(
        'text-center',
        card ? 'p-8' : 'py-12',
        className
      )}
      role="status"
      aria-live="polite"
    >
      {Icon && (
        <div 
          className={cn(
            'flex items-center justify-center rounded-xl mb-4 mx-auto',
            'bg-[var(--border-light)]',
            iconWrapperSizeClasses[iconSize]
          )}
          aria-hidden="true"
        >
          <Icon 
            className={cn(
              'text-[var(--text-muted)]',
              iconSizeClasses[iconSize]
            )} 
          />
        </div>
      )}
      
      <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-2">
        {title}
      </h3>
      
      {description && (
        <p className="text-[var(--text-secondary)] mb-4 max-w-md mx-auto">
          {description}
        </p>
      )}
      
      {action && (
        <Button 
          onClick={action.onClick}
          className="mt-2"
        >
          {action.icon && <action.icon className="w-4 h-4 mr-2" />}
          {action.label}
        </Button>
      )}
    </div>
  );

  if (card) {
    return (
      <div className="bg-card rounded-lg border border-[var(--border)]">
        {content}
      </div>
    );
  }

  return content;
};

/**
 * Compact empty state variant for smaller sections
 * 
 * @example
 * <CompactEmptyState
 *   icon={Users}
 *   message="No team members yet"
 * />
 */
export const CompactEmptyState: React.FC<{
  icon?: LucideIcon;
  message: string;
  className?: string;
}> = ({ icon: Icon, message, className }) => {
  return (
    <div 
      className={cn(
        'flex flex-col items-center justify-center py-8 text-center',
        className
      )}
      role="status"
    >
      {Icon && (
        <Icon 
          className="w-8 h-8 text-[var(--text-muted)] mb-2" 
          aria-hidden="true"
        />
      )}
      <p className="text-sm text-[var(--text-secondary)]">
        {message}
      </p>
    </div>
  );
};
