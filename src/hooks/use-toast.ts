
import { useState, useCallback, useEffect, useRef } from "react";

export type ToastType = "default" | "destructive";

export interface Toast {
  id: string;
  title?: string;
  description?: string;
  action?: React.ReactNode;
  variant?: ToastType;
}

export interface ToastOptions {
  title?: string;
  description?: string;
  action?: React.ReactNode;
  variant?: ToastType;
  duration?: number;
}

const TOAST_TIMEOUT = 5000;

function generateId() {
  return Math.random().toString(36).substr(2, 9);
}

export function useToast() {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const toastTimeoutsRef = useRef<Map<string, NodeJS.Timeout>>(new Map());

  const removeToast = useCallback((id: string) => {
    setToasts((prevToasts) => prevToasts.filter((toast) => toast.id !== id));
    
    // Clear the timeout
    const timeout = toastTimeoutsRef.current.get(id);
    if (timeout) {
      clearTimeout(timeout);
      toastTimeoutsRef.current.delete(id);
    }
  }, []);

  const toast = useCallback(
    ({ title, description, variant, action, duration = TOAST_TIMEOUT }: ToastOptions) => {
      const id = generateId();
      const newToast = { id, title, description, variant, action };
      
      setToasts((prevToasts) => [...prevToasts, newToast]);

      // Set timeout to remove toast
      const timeout = setTimeout(() => removeToast(id), duration);
      toastTimeoutsRef.current.set(id, timeout);

      return id;
    },
    [removeToast]
  );

  // Clean up timeouts on unmount
  useEffect(() => {
    return () => {
      toastTimeoutsRef.current.forEach((timeout) => {
        clearTimeout(timeout);
      });
    };
  }, []);

  return {
    toasts,
    toast,
    dismiss: removeToast,
  };
}

// For direct importing
export const toast = (options: ToastOptions) => {
  const event = new CustomEvent("toast", {
    detail: options,
  });
  window.dispatchEvent(event);
};

// Listen for toast events in components that use custom toast hook
if (typeof window !== "undefined") {
  window.addEventListener("toast", ((e: CustomEvent<ToastOptions>) => {
    const { title, description, variant, action, duration } = e.detail;
    const toastContainers = document.querySelectorAll("[data-toast-container]");
    
    if (toastContainers.length > 0) {
      const event = new CustomEvent("add-toast", {
        detail: { title, description, variant, action, duration },
      });
      toastContainers.forEach(container => {
        container.dispatchEvent(event);
      });
    } else {
      console.warn("Toast container not found. Toast message:", title, description);
    }
  }) as EventListener);
}
