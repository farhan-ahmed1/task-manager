import React from 'react';
import type { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PageTitleProps {
  /**
   * The title text
   */
  children: React.ReactNode;
  /**
   * Optional icon to display before the title
   */
  icon?: LucideIcon;
  /**
   * Optional subtitle or description
   */
  subtitle?: React.ReactNode;
  /**
   * Additional CSS classes for the container
   */
  className?: string;
  /**
   * Additional CSS classes for the title
   */
  titleClassName?: string;
  /**
   * Additional CSS classes for the subtitle
   */
  subtitleClassName?: string;
  /**
   * Custom actions to display on the right side
   */
  actions?: React.ReactNode;
}

/**
 * Consistent page title component with optional icon, subtitle, and actions
 * 
 * @example
 * // Basic title
 * <PageTitle>Today</PageTitle>
 * 
 * @example
 * // With icon and subtitle
 * <PageTitle icon={Calendar} subtitle="Monday, December 26">
 *   Today
 * </PageTitle>
 * 
 * @example
 * // With actions
 * <PageTitle 
 *   icon={FolderOpen}
 *   actions={<Button>Add Project</Button>}
 * >
 *   My Projects
 * </PageTitle>
 */
export const PageTitle: React.FC<PageTitleProps> = ({
  children,
  icon: Icon,
  subtitle,
  className,
  titleClassName,
  subtitleClassName,
  actions,
}) => {
  return (
    <div className={cn('pt-12 pb-6', className)}>
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <h1 
            className={cn(
              'text-xl sm:text-2xl md:text-3xl font-bold text-[var(--text-primary)] flex items-center gap-2',
              titleClassName
            )}
          >
            {Icon && <Icon className="w-6 h-6 flex-shrink-0" aria-hidden="true" />}
            <span className="truncate">{children}</span>
          </h1>
          {subtitle && (
            <p 
              className={cn(
                'text-sm sm:text-base text-[var(--text-secondary)] mt-2',
                subtitleClassName
              )}
            >
              {subtitle}
            </p>
          )}
        </div>
        {actions && (
          <div className="flex-shrink-0">
            {actions}
          </div>
        )}
      </div>
    </div>
  );
};

/**
 * Simpler inline title variant for sections within a page
 * 
 * @example
 * <SectionTitle>Today's Tasks</SectionTitle>
 */
export const SectionTitle: React.FC<{
  children: React.ReactNode;
  className?: string;
}> = ({ children, className }) => {
  return (
    <h2 
      className={cn(
        'text-base sm:text-lg font-semibold text-[var(--text-primary)] mb-4',
        className
      )}
    >
      {children}
    </h2>
  );
};
