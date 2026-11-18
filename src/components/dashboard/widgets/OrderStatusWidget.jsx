import React, { useState } from 'react';
import { PackageCheck, ArrowRight, ToggleLeft, ToggleRight } from 'lucide-react';
import EmptyState from '../../common/EmptyState';

export default function OrderStatusWidget({ items = [], onViewAll }) {
  const [simulateEmpty, setSimulateEmpty] = useState(false);
  const displayItems = (simulateEmpty ? [] : items).slice(0, 3);

  const getStatusBadge = (color) => {
    switch (color) {
      case 'amber':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'blue':
        return 'bg-sky-50 text-sky-700 border-sky-200';
      case 'purple':
        return 'bg-purple-50 text-purple-700 border-purple-200';
      case 'emerald':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  return (
    <div className="flex flex-col h-full bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
      <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-sky-100 text-sky-700 flex items-center justify-center">
            <PackageCheck className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-slate-800">Order Status Overview</h3>
            <p className="text-[11px] text-slate-500">Live order packing & fulfillment pipeline</p>
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
            title="No orders in pipeline" 
            message="All pending wholesale and retail orders have been dispatched."
            actionText="Simulate order status"
            onAction={() => setSimulateEmpty(false)}
          />
        ) : (
          <div className="space-y-2.5">
            {displayItems.map((item) => (
              <div key={item.id} className="p-3 rounded-lg border border-slate-100 bg-slate-50/40 flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-mono font-medium text-slate-500">{item.id}</span>
                    <h4 className="text-xs font-semibold text-slate-800 truncate">{item.client}</h4>
                  </div>
                  <p className="text-[11px] text-slate-500">{item.items} • <span className="font-semibold text-slate-700">{item.amount}</span></p>
                </div>
                <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border flex-shrink-0 ${getStatusBadge(item.statusColor)}`}>
                  {item.status}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="px-5 py-2.5 border-t border-slate-100 bg-slate-50/40 flex items-center justify-between text-xs">
        <span className="text-[11px] text-slate-500">Showing {displayItems.length} active orders</span>
        <button
          onClick={() => onViewAll('Orders')}
          className="font-medium text-sky-600 hover:text-sky-700 flex items-center gap-1 text-xs"
        >
          <span>View All</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}
