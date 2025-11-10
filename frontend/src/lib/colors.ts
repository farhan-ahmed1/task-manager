/**
 * Centralized Color System
 * All colors should use CSS variables from index.css
 * This file provides helper functions and type-safe color utilities
 */

// Priority colors mapped to CSS variables
export const getPriorityColor = (priority: 'HIGH' | 'MEDIUM' | 'LOW' | null): string => {
  switch (priority) {
    case 'HIGH':
      return 'var(--error)';
    case 'MEDIUM':
      return 'var(--warning)';
    case 'LOW':
      return 'var(--success)';
    default:
      return 'var(--text-tertiary)';
  }
};

// Priority background colors for badges
export const getPriorityBgColor = (priority: 'HIGH' | 'MEDIUM' | 'LOW' | null): string => {
  switch (priority) {
    case 'HIGH':
      return 'var(--error-light)';
    case 'MEDIUM':
      return 'var(--warning-light)';
    case 'LOW':
      return 'var(--success-light)';
    default:
      return 'var(--bg-tertiary)';
  }
};

// Status colors
export const getStatusColor = (status: 'COMPLETED' | 'IN_PROGRESS' | 'PENDING'): string => {
  switch (status) {
    case 'COMPLETED':
      return 'var(--success)';
    case 'IN_PROGRESS':
      return 'var(--info)';
    case 'PENDING':
      return 'var(--text-tertiary)';
  }
};

// Progress bar colors based on completion rate
export const getProgressColor = (rate: number): string => {
  if (rate >= 80) return 'var(--success)';
  if (rate >= 50) return 'var(--info)';
  if (rate >= 25) return 'var(--warning)';
  return 'var(--text-tertiary)';
};

// User avatar colors (consistent set for initials/avatars)
export const getUserAvatarColors = (): string[] => [
  'var(--primary)',      // Blue
  'var(--success)',      // Green  
  'var(--error)',        // Red
  'var(--warning)',      // Amber
  'var(--info)',         // Info blue
  'var(--primary-dark)', // Dark blue
];

// Semantic color classes for Tailwind
export const colorClasses = {
  // Primary
  primary: 'bg-[var(--primary)] text-white',
  primaryLight: 'bg-[var(--primary-light)] text-[var(--primary)]',
  primarySubtle: 'bg-[var(--primary-subtle)] text-[var(--primary)]',
  
  // Success
  success: 'bg-success text-white',
  successLight: 'bg-success-light text-success',
  
  // Warning  
  warning: 'bg-warning text-white',
  warningLight: 'bg-warning-light text-warning',
  
  // Error
  error: 'bg-error text-white',
  errorLight: 'bg-error-light text-error',
  
  // Info
  info: 'bg-info text-white',
  infoLight: 'bg-info-light text-info',
  
  // Neutral
  muted: 'bg-muted text-muted-foreground',
  secondary: 'bg-secondary text-secondary-foreground',
} as const;

// Button color variants
export const buttonVariants = {
  primary: 'bg-[var(--primary)] hover:bg-[var(--primary-dark)] text-white',
  secondary: 'bg-secondary hover:bg-muted text-secondary-foreground',
  success: 'bg-success hover:opacity-90 text-white',
  warning: 'bg-warning hover:opacity-90 text-white',
  error: 'bg-error hover:opacity-90 text-white',
  ghost: 'hover:bg-muted hover:text-foreground',
  outline: 'border-[var(--border)] text-[var(--text-secondary)] hover:bg-muted',
} as const;

// Badge color variants  
export const badgeVariants = {
  success: 'bg-success-light text-success border-success',
  warning: 'bg-warning-light text-warning border-warning',
  error: 'bg-error-light text-error border-error',
  info: 'bg-info-light text-info border-info',
  default: 'bg-muted text-muted-foreground border-border',
} as const;

// Text color utilities
export const textColors = {
  primary: 'text-[var(--text-primary)]',
  secondary: 'text-[var(--text-secondary)]',
  tertiary: 'text-[var(--text-tertiary)]',
  muted: 'text-[var(--text-muted)]',
  success: 'text-success',
  warning: 'text-warning',
  error: 'text-error',
  info: 'text-info',
} as const;

// Background color utilities
export const bgColors = {
  primary: 'bg-[var(--bg-primary)]',
  secondary: 'bg-[var(--bg-secondary)]',
  tertiary: 'bg-[var(--bg-tertiary)]',
  card: 'bg-card',
  muted: 'bg-muted',
} as const;

// Border color utilities
export const borderColors = {
  default: 'border-[var(--border)]',
  light: 'border-[var(--border-light)]',
  focus: 'border-[var(--border-focus)]',
  success: 'border-success',
  warning: 'border-warning',
  error: 'border-error',
  info: 'border-info',
} as const;

export default {
  getPriorityColor,
  getPriorityBgColor,
  getStatusColor,
  getProgressColor,
  getUserAvatarColors,
  colorClasses,
  buttonVariants,
  badgeVariants,
  textColors,
  bgColors,
  borderColors,
};
