import { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react';
import { IconAlert, IconCheck, IconInfo } from './icons.jsx';

const ToastContext = createContext(null);

const ICONS = {
  success: IconCheck,
  error: IconAlert,
  info: IconInfo,
};

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const counter = useRef(0);

  const dismiss = useCallback((id) => {
    setToasts((current) => current.filter((toast) => toast.id !== id));
  }, []);

  const push = useCallback(
    (message, tone = 'success', duration = 3800) => {
      counter.current += 1;
      const id = counter.current;
      setToasts((current) => [...current, { id, message, tone }]);
      setTimeout(() => dismiss(id), duration);
    },
    [dismiss]
  );

  const value = useMemo(
    () => ({
      toast: push,
      success: (message) => push(message, 'success'),
      error: (message) => push(message, 'error', 5000),
      info: (message) => push(message, 'info'),
    }),
    [push]
  );

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="toast-stack" role="status" aria-live="polite">
        {toasts.map((toast) => {
          const Icon = ICONS[toast.tone] ?? IconInfo;
          return (
            <div key={toast.id} className="toast" data-tone={toast.tone} onClick={() => dismiss(toast.id)}>
              <Icon />
              <span>{toast.message}</span>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) throw new Error('useToast must be used inside <ToastProvider>');
  return context;
}
