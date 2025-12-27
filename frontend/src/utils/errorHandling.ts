import { toast } from 'sonner';

/**
 * Standard error response from API
 */
export interface ApiError {
  error: string;
  code?: string;
  details?: unknown;
}

/**
 * Error severity levels for different handling strategies
 */
export const ErrorSeverity = {
  INFO: 'info',
  WARNING: 'warning',
  ERROR: 'error',
  CRITICAL: 'critical',
} as const;

export type ErrorSeverityType = typeof ErrorSeverity[keyof typeof ErrorSeverity];

/**
 * Options for error handling
 */
export interface ErrorHandlingOptions {
  /** Show toast notification to user */
  showToast?: boolean;
  /** Toast message (if different from error message) */
  toastMessage?: string;
  /** Log to console */
  logToConsole?: boolean;
  /** Error severity level */
  severity?: ErrorSeverityType;
  /** Additional context for logging */
  context?: Record<string, unknown>;
  /** Custom error handler */
  onError?: (error: Error) => void;
}

/**
 * Default error handling options
 */
const DEFAULT_OPTIONS: ErrorHandlingOptions = {
  showToast: true,
  logToConsole: true,
  severity: 'error' as ErrorSeverityType,
};

/**
 * Extracts a user-friendly error message from various error types
 */
export function getErrorMessage(error: unknown): string {
  if (typeof error === 'string') {
    return error;
  }

  if (error instanceof Error) {
    return error.message;
  }

  if (error && typeof error === 'object') {
    // Handle API error responses
    if ('error' in error && typeof error.error === 'string') {
      return error.error;
    }

    // Handle Response objects
    if ('statusText' in error && typeof error.statusText === 'string') {
      return error.statusText;
    }

    // Handle objects with message property
    if ('message' in error && typeof error.message === 'string') {
      return error.message;
    }
  }

  return 'An unexpected error occurred';
}

/**
 * Comprehensive error handler that logs errors and optionally shows user notifications
 * 
 * @example
 * ```ts
 * try {
 *   await fetchData();
 * } catch (error) {
 *   handleError(error, {
 *     toastMessage: 'Failed to load data',
 *     context: { userId: user.id }
 *   });
 * }
 * ```
 */
export function handleError(
  error: unknown,
  options: ErrorHandlingOptions = {}
): void {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  const errorMessage = opts.toastMessage || getErrorMessage(error);

  // Log to console if enabled
  if (opts.logToConsole) {
    const logContext = opts.context ? `\nContext: ${JSON.stringify(opts.context)}` : '';
    
    switch (opts.severity) {
      case ErrorSeverity.INFO:
        console.info(`[INFO] ${errorMessage}${logContext}`, error);
        break;
      case ErrorSeverity.WARNING:
        console.warn(`[WARNING] ${errorMessage}${logContext}`, error);
        break;
      case ErrorSeverity.CRITICAL:
        console.error(`[CRITICAL] ${errorMessage}${logContext}`, error);
        break;
      default:
        console.error(`[ERROR] ${errorMessage}${logContext}`, error);
    }
  }

  // Show toast notification if enabled
  if (opts.showToast) {
    switch (opts.severity) {
      case ErrorSeverity.INFO:
        toast.info(errorMessage);
        break;
      case ErrorSeverity.WARNING:
        toast.warning(errorMessage);
        break;
      case ErrorSeverity.CRITICAL:
        toast.error(errorMessage, {
          duration: 10000, // Show critical errors longer
          closeButton: true,
        });
        break;
      default:
        toast.error(errorMessage);
    }
  }

  // Call custom error handler if provided
  if (opts.onError && error instanceof Error) {
    opts.onError(error);
  }

  // In production, send critical errors to error tracking service
  if (opts.severity === ErrorSeverity.CRITICAL && process.env.NODE_ENV === 'production') {
    // TODO: Integrate with error tracking service (Sentry, LogRocket, etc.)
    // logErrorToService(error, opts.context);
  }
}

/**
 * Wraps an async function with error handling
 * 
 * @example
 * ```ts
 * const safeDelete = withErrorHandling(
 *   async (id: string) => await deleteItem(id),
 *   { toastMessage: 'Failed to delete item' }
 * );
 * 
 * await safeDelete('123');
 * ```
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function withErrorHandling<T extends (...args: any[]) => Promise<any>>(
  fn: T,
  options: ErrorHandlingOptions = {}
): T {
  return (async (...args: Parameters<T>): Promise<ReturnType<T>> => {
    try {
      return await fn(...args);
    } catch (error) {
      handleError(error, options);
      throw error; // Re-throw so caller can handle if needed
    }
  }) as T;
}

/**
 * Creates a safe version of an async function that won't throw
 * Returns [data, error] tuple similar to Go's error handling
 * 
 * @example
 * ```ts
 * const [data, error] = await safe(fetchUser(userId));
 * if (error) {
 *   handleError(error);
 *   return;
 * }
 * // Use data safely
 * ```
 */
export async function safe<T>(
  promise: Promise<T>
): Promise<[T | null, Error | null]> {
  try {
    const data = await promise;
    return [data, null];
  } catch (error) {
    return [null, error instanceof Error ? error : new Error(String(error))];
  }
}

/**
 * Validates that a value is not null/undefined and throws a user-friendly error
 * 
 * @example
 * ```ts
 * const user = assertDefined(currentUser, 'Please log in to continue');
 * ```
 */
export function assertDefined<T>(
  value: T | null | undefined,
  errorMessage: string = 'Required value is missing'
): T {
  if (value === null || value === undefined) {
    throw new Error(errorMessage);
  }
  return value;
}

/**
 * Type guard to check if an error is an API error
 */
export function isApiError(error: unknown): error is ApiError {
  return (
    typeof error === 'object' &&
    error !== null &&
    'error' in error &&
    typeof (error as ApiError).error === 'string'
  );
}

/**
 * Retry a function with exponential backoff
 */
export async function retry<T>(
  fn: () => Promise<T>,
  options: {
    maxAttempts?: number;
    delayMs?: number;
    backoffMultiplier?: number;
    onRetry?: (attempt: number, error: Error) => void;
  } = {}
): Promise<T> {
  const {
    maxAttempts = 3,
    delayMs = 1000,
    backoffMultiplier = 2,
    onRetry,
  } = options;

  let lastError: Error;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      if (attempt < maxAttempts) {
        const delay = delayMs * Math.pow(backoffMultiplier, attempt - 1);
        
        if (onRetry) {
          onRetry(attempt, lastError);
        }

        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }

  throw lastError!;
}
