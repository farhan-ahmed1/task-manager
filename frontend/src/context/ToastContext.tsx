import { createContext, useContext, type ReactNode } from 'react';
import { Toaster } from 'sonner';

/**
 * Toast context for providing toast functionality throughout the app
 * Uses Sonner library for toast notifications
 */
// Empty interface for future extension
// eslint-disable-next-line @typescript-eslint/no-empty-object-type
interface ToastContextType {}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

interface ToastProviderProps {
  children: ReactNode;
}

/**
 * Toast provider component that wraps the app with Sonner toaster
 * Provides consistent toast styling and positioning
 */
export function ToastProvider({ children }: ToastProviderProps) {
  return (
    <ToastContext.Provider value={{}}>
      {children}
      <Toaster
        position="top-right"
        expand={false}
        richColors
        closeButton
        duration={4000}
        toastOptions={{
          className: 'toast-custom',
          style: {
            background: 'white',
            border: '1px solid #e2e8f0',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
          },
          classNames: {
            error: 'border-[var(--error)]',
            success: 'border-[var(--success)]',
            warning: 'border-[var(--warning)]',
            info: 'border-[var(--info)]',
          },
        }}
      />
    </ToastContext.Provider>
  );
}

/**
 * Hook to access toast context
 * Currently a placeholder but can be extended for custom toast logic
 */
// eslint-disable-next-line react-refresh/only-export-components
export function useToast() {
  const context = useContext(ToastContext);
  if (context === undefined) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}
