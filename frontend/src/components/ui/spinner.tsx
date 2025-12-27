import React from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SpinnerProps {
  /**
   * Size of the spinner
   * @default 'md'
   */
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  /**
   * Optional text to display below the spinner
   */
  text?: string;
  /**
   * Additional CSS classes
   */
  className?: string;
  /**
   * If true, centers the spinner in a flex container
   * @default false
   */
  centered?: boolean;
}

const sizeClasses = {
  xs: 'h-3 w-3',
  sm: 'h-4 w-4',
  md: 'h-6 w-6',
  lg: 'h-8 w-8',
  xl: 'h-12 w-12',
};

const textSizeClasses = {
  xs: 'text-xs',
  sm: 'text-sm',
  md: 'text-base',
  lg: 'text-lg',
  xl: 'text-xl',
};

/**
 * Consistent loading spinner component using Lucide's Loader2 icon
 * 
 * @example
 * // Basic spinner
 * <Spinner />
 * 
 * @example
 * // With text
 * <Spinner size="lg" text="Loading..." />
 * 
 * @example
 * // Centered in page
 * <Spinner centered size="lg" text="Loading tasks..." />
 * 
 * @example
 * // Inline with button
 * <Button disabled>
 *   <Spinner size="sm" className="mr-2" />
 *   Processing...
 * </Button>
 */
export const Spinner: React.FC<SpinnerProps> = ({ 
  size = 'md', 
  text,
  className,
  centered = false
}) => {
  const spinner = (
    <div 
      className={cn(
        'flex flex-col items-center',
        centered && 'justify-center py-12',
        className
      )}
      role="status"
      aria-live="polite"
      aria-label={text || 'Loading'}
    >
      <Loader2 
        className={cn(
          'animate-spin text-primary',
          sizeClasses[size],
          text && 'mb-3'
        )} 
      />
      {text && (
        <p className={cn(
          'text-[var(--text-secondary)] font-medium',
          textSizeClasses[size]
        )}>
          {text}
        </p>
      )}
    </div>
  );

  return spinner;
};

/**
 * Full-page loading spinner for page-level loading states
 * 
 * @example
 * if (isLoading) return <PageSpinner />;
 */
export const PageSpinner: React.FC<{ text?: string }> = ({ text = 'Loading...' }) => (
  <div className="flex items-center justify-center min-h-[400px]">
    <Spinner size="lg" text={text} centered />
  </div>
);

/**
 * Inline spinner for button loading states
 * 
 * @example
 * <Button disabled={isLoading}>
 *   {isLoading && <ButtonSpinner />}
 *   Save Changes
 * </Button>
 */
export const ButtonSpinner: React.FC<{ className?: string }> = ({ className }) => (
  <Spinner size="sm" className={cn('mr-2', className)} />
);
