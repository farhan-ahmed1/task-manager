import React from 'react';
import { cn } from '@/lib/utils';

/**
 * PageContainer Component
 * 
 * A standardized container component for consistent page layouts across the application.
 * Provides size variants for different content types while maintaining consistent spacing.
 * 
 * @example
 * ```tsx
 * <PageContainer size="narrow">
 *   <PageTitle>Today</PageTitle>
 *   <TaskList />
 * </PageContainer>
 * ```
 */

export interface PageContainerProps {
  /** Content to be rendered inside the container */
  children: React.ReactNode;
  
  /** 
   * Container size variant
   * - narrow: 900px max-width (for focused content like task lists, activity feeds)
   * - standard: 1024px max-width (for regular pages with moderate content)
   * - wide: 1400px max-width (for dashboards and data-heavy pages)
   * @default "standard"
   */
  size?: 'narrow' | 'standard' | 'wide';
  
  /** 
   * Apply padding to the container
   * @default true
   */
  padding?: boolean;
  
  /** Additional CSS classes */
  className?: string;
  
  /** 
   * Center content vertically (useful for loading/error states)
   * @default false
   */
  centerContent?: boolean;
}

const PageContainer: React.FC<PageContainerProps> = ({
  children,
  size = 'standard',
  padding = true,
  className,
  centerContent = false,
}) => {
  const sizeClasses = {
    narrow: 'max-w-[900px]',
    standard: 'max-w-5xl',
    wide: 'max-w-7xl',
  };

  return (
    <div
      className={cn(
        // Base styles
        'mx-auto w-full',
        
        // Size variant
        sizeClasses[size],
        
        // Padding (responsive)
        padding && 'px-4 sm:px-6',
        
        // Center content vertically if needed
        centerContent && 'min-h-[50vh] flex items-center justify-center',
        
        // Custom classes
        className
      )}
    >
      {children}
    </div>
  );
};

export default PageContainer;
