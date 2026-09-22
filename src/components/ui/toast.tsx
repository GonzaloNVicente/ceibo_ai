"use client";

import { useToast } from '@/contexts/toast-context';
import { AlertCircle, CheckCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

export function ToastContainer() {
  const { toasts, removeToast } = useToast();

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={cn(
            "flex items-center gap-3 px-4 py-3 rounded-lg border shadow-lg transition-all animate-in slide-in-from-bottom-5",
            toast.type === 'error' 
              ? "bg-destructive/15 border-destructive/30 text-destructive"
              : "bg-success/15 border-success/30 text-success"
          )}
          onClick={() => removeToast(toast.id)}
          style={{ cursor: 'pointer' }}
        >
          {toast.type === 'error' ? (
            <AlertCircle className="size-5 shrink-0" />
          ) : (
            <CheckCircle className="size-5 shrink-0" />
          )}
          <span className="text-sm font-semibold">{toast.message}</span>
        </div>
      ))}
    </div>
  );
}
