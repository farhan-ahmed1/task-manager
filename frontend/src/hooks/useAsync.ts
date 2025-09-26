import { useState, useCallback } from 'react';

export interface UseAsyncResult<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
  execute: (...args: unknown[]) => Promise<T | null>;
  reset: () => void;
}

export function useAsync<T>(
  asyncFunction: (...args: unknown[]) => Promise<T>
): UseAsyncResult<T> {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const execute = useCallback(
    async (...args: unknown[]): Promise<T | null> => {
      try {
        setLoading(true);
        setError(null);
        const result = await asyncFunction(...args);
        setData(result);
        return result;
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred';
        setError(errorMessage);
        return null;
      } finally {
        setLoading(false);
      }
    },
    [asyncFunction]
  );

  const reset = useCallback(() => {
    setData(null);
    setLoading(false);
    setError(null);
  }, []);

  return { data, loading, error, execute, reset };
}

export default useAsync;