import React, { useState } from 'react';
import { AlertOctagon, ArrowRight, ToggleLeft, ToggleRight } from 'lucide-react';
import EmptyState from '../../common/EmptyState';

export default function CustomerIssuesWidget({ items = [], onViewAll, onActionPlaceholder }) {
  const [simulateEmpty, setSimulateEmpty] = useState(false);
  const displayItems = (simulateEmpty ? [] : items).slice(0, 3);

  return (
    <div className="flex flex-col h-full bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
      <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-rose-100 text-rose-700 flex items-center justify-center">
            <AlertOctagon className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-slate-800">Unresolved Customer Issues</h3>
            <p className="text-[11px] text-slate-500">Complaints, damages & billing disputes</p>
          </div>
        </div>
        <button
          onClick={() => setSimulateEmpty(!simulateEmpty)}
          className="text-[10px] text-slate-500 hover:text-slate-800 flex items-center gap-1 px-1.5 py-0.5 rounded border border-slate-200 bg-white"
        >
          {simulateEmpty ? <ToggleRight className="w-3.5 h-3.5 text-sky-600" /> : <ToggleLeft className="w-3.5 h-3.5 text-slate-400" />}
          <span>Empty state</span>
        </button>
      </div>

      <div className="p-4 flex-1">
        {displayItems.length === 0 ? (
          <EmptyState 
            title="Zero customer disputes" 
            message="No unresolved complaints or return requests reported."
            actionText="Simulate pending complaints"
            onAction={() => setSimulateEmpty(false)}
          />
        ) : (
          <div className="space-y-2.5">
            {displayItems.map((item) => (
              <div key={item.id} className="p-3 rounded-lg border border-slate-100 bg-slate-50/40">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-mono font-medium px-1.5 py-0.2 rounded bg-slate-200 text-slate-700">
                      {item.id}
                    </span>
                    <h4 className="text-xs font-semibold text-slate-800">{item.customer}</h4>
                  </div>
                  <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${
                    item.severity === 'High' ? 'bg-rose-50 text-rose-700 border-rose-200' : 'bg-amber-50 text-amber-700 border-amber-200'
                  }`}>
                    {item.severity} Severity
                  </span>
                </div>
                <p className="text-xs text-slate-600 mt-1">{item.issue}</p>
                <div className="flex items-center justify-between mt-2 pt-1.5 border-t border-slate-200/60 text-[10px] text-slate-400">
                  <span>Reported: {item.reported}</span>
                  <span className="font-medium text-slate-700">{item.status}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="px-5 py-2.5 border-t border-slate-100 bg-slate-50/40 flex items-center justify-between text-xs">
        <span className="text-[11px] text-slate-500">Showing {displayItems.length} open tickets</span>
        <button
          onClick={() => onViewAll('Unresolved Customer Issues')}
          className="font-medium text-sky-600 hover:text-sky-700 flex items-center gap-1 text-xs"
        >
          <span>View All</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}
