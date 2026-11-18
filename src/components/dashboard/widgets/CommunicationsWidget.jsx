import React, { useState } from 'react';
import { MessageSquareText, Mail, MessageCircle, AlertCircle, ArrowRight, ToggleLeft, ToggleRight, Clock } from 'lucide-react';
import EmptyState from '../../common/EmptyState';

export default function CommunicationsWidget({ items = [], onViewAll, onActionPlaceholder }) {
  const [simulateEmpty, setSimulateEmpty] = useState(false);
  const displayItems = (simulateEmpty ? [] : items).slice(0, 3);

  const urgencyBadge = (urgency) => {
    switch (urgency) {
      case 'High':
        return 'bg-rose-50 text-rose-700 border-rose-200';
      case 'Medium':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      default:
        return 'bg-slate-100 text-slate-600 border-slate-200';
    }
  };

  return (
    <div className="flex flex-col h-full bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
      {/* Widget Header */}
      <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-sky-100 text-sky-700 flex items-center justify-center">
            <MessageSquareText className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-slate-800">Communications Requiring Attention</h3>
            <p className="text-[11px] text-slate-500">Urgent messages from clients & suppliers</p>
          </div>
        </div>

        {/* Empty state toggle */}
        <button
          onClick={() => setSimulateEmpty(!simulateEmpty)}
          className="text-[10px] text-slate-500 hover:text-slate-800 flex items-center gap-1 px-1.5 py-0.5 rounded border border-slate-200 bg-white"
          title="Toggle empty state view for evaluation"
        >
          {simulateEmpty ? <ToggleRight className="w-3.5 h-3.5 text-sky-600" /> : <ToggleLeft className="w-3.5 h-3.5 text-slate-400" />}
          <span>Empty state</span>
        </button>
      </div>

      {/* Widget Content */}
      <div className="p-4 flex-1">
        {displayItems.length === 0 ? (
          <EmptyState 
            icon={MessageSquareText}
            title="Inbox cleared" 
            message="No urgent customer inquiries or supplier messages requiring action."
            actionText="Simulate pending messages"
            onAction={() => setSimulateEmpty(false)}
          />
        ) : (
          <div className="space-y-2.5">
            {displayItems.map((item) => (
              <div 
                key={item.id}
                onClick={() => onActionPlaceholder(`Communication: ${item.sender}`, `Viewing communication details for ${item.sender} is a prototype placeholder.`)}
                className="p-3 rounded-lg border border-slate-100 bg-slate-50/40 hover:bg-slate-50 hover:border-slate-200 transition cursor-pointer group"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-slate-800 truncate group-hover:text-sky-700 transition-colors">
                        {item.sender}
                      </span>
                      <span className="text-[10px] text-slate-400">
                        • {item.channel}
                      </span>
                    </div>
                    <p className="text-xs font-medium text-slate-700 mt-0.5 line-clamp-1">
                      {item.subject}
                    </p>
                    <p className="text-[11px] text-slate-500 mt-0.5 line-clamp-1">
                      {item.preview}
                    </p>
                  </div>

                  <div className="flex flex-col items-end gap-1 flex-shrink-0">
                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${urgencyBadge(item.urgency)}`}>
                      {item.urgency}
                    </span>
                    <span className="text-[10px] text-slate-400 flex items-center gap-1">
                      <Clock className="w-2.5 h-2.5" />
                      {item.time}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Widget Footer */}
      <div className="px-5 py-2.5 border-t border-slate-100 bg-slate-50/40 flex items-center justify-between text-xs">
        <span className="text-[11px] text-slate-500">
          Showing {displayItems.length} active threads
        </span>
        <button
          onClick={() => onViewAll('Communications')}
          className="font-medium text-sky-600 hover:text-sky-700 flex items-center gap-1 text-xs transition"
        >
          <span>View All</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}
