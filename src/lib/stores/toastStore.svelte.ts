// Toast notification store using Svelte 5 runes
import { nanoid } from 'nanoid';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

export interface Toast {
  id: string;
  message: string;
  type: ToastType;
  duration: number;
}

interface ToastOptions {
  type?: ToastType;
  duration?: number;
}

const DEFAULT_DURATION = 4000;

let toasts = $state<Toast[]>([]);

function addToast(message: string, options: ToastOptions = {}): string {
  const id = nanoid(8);
  const toast: Toast = {
    id,
    message,
    type: options.type ?? 'info',
    duration: options.duration ?? DEFAULT_DURATION,
  };

  toasts = [...toasts, toast];

  // Auto-remove after duration
  if (toast.duration > 0) {
    setTimeout(() => {
      removeToast(id);
    }, toast.duration);
  }

  return id;
}

function removeToast(id: string): void {
  toasts = toasts.filter(t => t.id !== id);
}

function clearAll(): void {
  toasts = [];
}

// Convenience methods
function success(message: string, duration?: number): string {
  return addToast(message, { type: 'success', duration });
}

function error(message: string, duration?: number): string {
  return addToast(message, { type: 'error', duration: duration ?? 6000 });
}

function info(message: string, duration?: number): string {
  return addToast(message, { type: 'info', duration });
}

function warning(message: string, duration?: number): string {
  return addToast(message, { type: 'warning', duration });
}

export const toastStore = {
  get toasts() { return toasts; },
  add: addToast,
  remove: removeToast,
  clear: clearAll,
  success,
  error,
  info,
  warning,
};
