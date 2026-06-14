import React from 'react';
import { useToastStore } from '../stores/toastStore';
import { X, CheckCircle, AlertTriangle, AlertCircle, Info } from 'lucide-react';

export default function Toast() {
  const { toasts, removeToast } = useToastStore();

  if (toasts.length === 0) return null;

  return (
    <div className="fixed top-4 right-4 z-50 flex flex-col gap-2 max-w-sm w-full">
      {toasts.map((toast) => {
        const isSuccess = toast.type === 'success';
        const isWarning = toast.type === 'warning';
        const isError = toast.type === 'error';

        return (
          <div
            key={toast.id}
            className={`flex items-center justify-between p-4 rounded-lg shadow-lg border transition-all duration-300 transform translate-x-0 ${
              isSuccess
                ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                : isWarning
                ? 'bg-amber-50 border-amber-200 text-amber-800'
                : isError
                ? 'bg-rose-50 border-rose-200 text-rose-800'
                : 'bg-blue-50 border-blue-200 text-blue-800'
            }`}
          >
            <div className="flex items-center gap-3">
              {isSuccess && <CheckCircle className="w-5 h-5 text-emerald-500 shrink-0" />}
              {isWarning && <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0" />}
              {isError && <AlertCircle className="w-5 h-5 text-rose-500 shrink-0" />}
              {!isSuccess && !isWarning && !isError && <Info className="w-5 h-5 text-blue-500 shrink-0" />}
              <p className="text-sm font-medium">{toast.message}</p>
            </div>
            <button
              onClick={() => removeToast(toast.id)}
              className="p-1 hover:bg-black/5 rounded-full transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        );
      })}
    </div>
  );
}
