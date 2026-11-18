import React, { useState } from 'react';
import { History, ArrowRight, ToggleLeft, ToggleRight, Radio } from 'lucide-react';
import EmptyState from '../../common/EmptyState';

export default function RecentActivityWidget({ items = [], onViewAll }) {
  const [simulateEmpty, setSimulateEmpty] = useState(false);
  const displayItems = (simulateEmpty ? [] : items).slice(0, 3);

  return (
    <div className="flex flex-col h-full bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
      <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center">
            <History className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-slate-800">Recent Activity</h3>
            <p className="text-[11px] text-slate-500">Live operational events & status logs</p>
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
            title="No recent events" 
            message="No system activity recorded yet today."
            actionText="Simulate activity events"
            onAction={() => setSimulateEmpty(false)}
          />
        ) : (
          <div className="space-y-3 relative before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
            {displayItems.map((item) => (
              <div key={item.id} className="relative pl-6">
                <span className="absolute left-0.5 top-1.5 w-3 h-3 rounded-full bg-indigo-600 border-2 border-white ring-2 ring-indigo-100"></span>
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="text-xs font-semibold text-slate-800">{item.action}</span>
                    <p className="text-xs text-slate-600 mt-0.5">{item.details}</p>
                  </div>
                  <span className="text-[10px] text-slate-400 flex-shrink-0">{item.time}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="px-5 py-2.5 border-t border-slate-100 bg-slate-50/40 flex items-center justify-between text-xs">
        <span className="text-[11px] text-slate-500">Showing {displayItems.length} recent events</span>
        <button
          onClick={() => onViewAll('Recent Activity')}
          className="font-medium text-sky-600 hover:text-sky-700 flex items-center gap-1 text-xs"
        >
          <span>View All</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}
