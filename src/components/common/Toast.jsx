import React, { useEffect } from 'react';
import { Info, X, AlertTriangle, CheckCircle } from 'lucide-react';

export default function Toast({ toast, onClose }) {
  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => {
      onClose();
    }, 4000);
    return () => clearTimeout(timer);
  }, [toast, onClose]);

  if (!toast) return null;

  const iconMap = {
    info: <Info className="w-5 h-5 text-sky-600 flex-shrink-0" />,
    warning: <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0" />,
    success: <CheckCircle className="w-5 h-5 text-emerald-600 flex-shrink-0" />,
  };

  const borderMap = {
    info: 'border-sky-200 bg-sky-50 text-sky-900',
    warning: 'border-amber-200 bg-amber-50 text-amber-900',
    success: 'border-emerald-200 bg-emerald-50 text-emerald-900',
  };

  return (
    <div className="fixed bottom-5 left-1/2 -translate-x-1/2 z-50 max-w-md w-full px-4 animate-in fade-in slide-in-from-bottom-4 duration-200">
      <div className={`flex items-start gap-3 p-4 rounded-lg border shadow-lg ${borderMap[toast.type || 'info']}`}>
        {iconMap[toast.type || 'info']}
        <div className="flex-1 text-sm">
          <p className="font-semibold">{toast.title || 'Notification'}</p>
          <p className="mt-0.5 text-xs opacity-90">{toast.message}</p>
        </div>
        <button
          onClick={onClose}
          className="p-1 rounded hover:bg-black/5 text-slate-500 hover:text-slate-800 transition"
          aria-label="Close notification"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
