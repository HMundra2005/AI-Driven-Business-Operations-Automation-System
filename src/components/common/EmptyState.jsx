import React from 'react';
import { CheckCircle2 } from 'lucide-react';

export default function EmptyState({ 
  icon: Icon = CheckCircle2, 
  title = "All caught up", 
  message = "No items currently require your attention in this section.",
  actionText,
  onAction
}) {
  return (
    <div className="flex flex-col items-center justify-center py-10 px-4 text-center">
      <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 mb-3">
        <Icon className="w-6 h-6 stroke-[1.75]" />
      </div>
      <h4 className="text-sm font-semibold text-slate-700">{title}</h4>
      <p className="text-xs text-slate-500 mt-1 max-w-xs">{message}</p>
      {actionText && (
        <button
          onClick={onAction}
          className="mt-3 text-xs font-medium text-sky-600 hover:text-sky-700 hover:underline"
        >
          {actionText}
        </button>
      )}
    </div>
  );
}
