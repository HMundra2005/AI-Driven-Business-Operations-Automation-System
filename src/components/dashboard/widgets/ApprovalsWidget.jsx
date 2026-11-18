import React, { useState } from 'react';
import { ShieldCheck, Clock, ArrowRight, ToggleLeft, ToggleRight, CheckCircle2, ChevronRight } from 'lucide-react';
import EmptyState from '../../common/EmptyState';

export default function ApprovalsWidget({ items = [], onViewAll, onActionPlaceholder }) {
  const [simulateEmpty, setSimulateEmpty] = useState(false);
  const displayItems = (simulateEmpty ? [] : items).slice(0, 3);

  return (
    <div className="flex flex-col h-full bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
      {/* Widget Header */}
      <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-purple-100 text-purple-700 flex items-center justify-center">
            <ShieldCheck className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-slate-800">Pending Approvals</h3>
            <p className="text-[11px] text-slate-500">Actions awaiting owner decision</p>
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
            icon={CheckCircle2}
            title="No pending approvals" 
            message="You have reviewed all purchase orders, credit notes, and supplier requests."
            actionText="Simulate pending approvals"
            onAction={() => setSimulateEmpty(false)}
          />
        ) : (
          <div className="space-y-2.5">
            {displayItems.map((item) => (
              <div 
                key={item.id}
                className="p-3 rounded-lg border border-slate-100 bg-slate-50/50 hover:bg-slate-50 hover:border-slate-200 transition flex flex-col gap-1.5"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-mono font-medium px-1.5 py-0.2 rounded bg-slate-200/70 text-slate-700">
                        {item.id}
                      </span>
                      <span className="text-xs font-semibold text-slate-800 truncate">
                        {item.title}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 mt-0.5 line-clamp-1">
                      {item.details}
                    </p>
                  </div>

                  <div className="text-right flex-shrink-0">
                    <span className="text-xs font-bold text-slate-800 block">
                      {item.amount}
                    </span>
                    <span className="text-[10px] text-slate-400">
                      {item.requestedBy}
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-1 border-t border-slate-200/50 text-[10px]">
                  <span className="text-slate-400 flex items-center gap-1">
                    <Clock className="w-3 h-3 text-slate-400" />
                    {item.date}
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-purple-50 text-purple-700 border border-purple-200">
                      {item.status}
                    </span>
                    <button
                      onClick={() => onActionPlaceholder(`Review ${item.id}`, `Approval review interface for "${item.id}" is a prototype placeholder.`)}
                      className="px-2 py-0.5 rounded bg-sky-600 hover:bg-sky-700 text-white font-medium text-[10px] transition"
                    >
                      Review
                    </button>
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
          Showing {displayItems.length} approvals in queue
        </span>
        <button
          onClick={() => onViewAll('Pending Approvals')}
          className="font-medium text-sky-600 hover:text-sky-700 flex items-center gap-1 text-xs transition"
        >
          <span>View All</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}
