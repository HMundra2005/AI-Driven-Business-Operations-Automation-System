import React, { useState } from 'react';
import { Boxes, AlertTriangle, ArrowRight, ToggleLeft, ToggleRight } from 'lucide-react';
import EmptyState from '../../common/EmptyState';

export default function InventoryWidget({ items = [], onViewAll }) {
  const [simulateEmpty, setSimulateEmpty] = useState(false);
  const displayItems = (simulateEmpty ? [] : items).slice(0, 3);

  return (
    <div className="flex flex-col h-full bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
      {/* Widget Header */}
      <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center">
            <Boxes className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-slate-800">Inventory & Stock</h3>
            <p className="text-[11px] text-slate-500">Items below reorder thresholds</p>
          </div>
        </div>

        {/* Action & Empty State Simulation Toggle */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setSimulateEmpty(!simulateEmpty)}
            className="text-[10px] text-slate-500 hover:text-slate-800 flex items-center gap-1 px-1.5 py-0.5 rounded border border-slate-200 bg-white"
            title="Toggle empty state view for evaluation"
          >
            {simulateEmpty ? <ToggleRight className="w-3.5 h-3.5 text-sky-600" /> : <ToggleLeft className="w-3.5 h-3.5 text-slate-400" />}
            <span>Empty state</span>
          </button>
        </div>
      </div>

      {/* Widget Content */}
      <div className="p-4 flex-1">
        {displayItems.length === 0 ? (
          <EmptyState 
            title="All inventory well-stocked" 
            message="No products are currently under reorder or critical thresholds."
            actionText="Simulate low stock items"
            onAction={() => setSimulateEmpty(false)}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="text-slate-400 font-semibold border-b border-slate-100 uppercase tracking-wider text-[10px]">
                  <th className="pb-2">Product Name</th>
                  <th className="pb-2 text-center">Current</th>
                  <th className="pb-2 text-center">Threshold</th>
                  <th className="pb-2 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {displayItems.map((item) => {
                  const isCritical = item.status === 'Critical';
                  return (
                    <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-2.5 pr-2">
                        <div className="font-medium text-slate-800">{item.name}</div>
                        <div className="text-[10px] text-slate-400 font-mono">{item.id} • {item.category}</div>
                      </td>
                      <td className="py-2.5 text-center font-semibold text-slate-700">
                        {item.currentStock} {item.unit}
                      </td>
                      <td className="py-2.5 text-center text-slate-500">
                        {item.reorderLevel} {item.unit}
                      </td>
                      <td className="py-2.5 text-right">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                            isCritical
                              ? 'bg-rose-50 text-rose-700 border border-rose-200'
                              : 'bg-amber-50 text-amber-700 border border-amber-200'
                          }`}
                        >
                          {isCritical && <span className="w-1.5 h-1.5 rounded-full bg-rose-500 mr-1 animate-pulse"></span>}
                          {item.status}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Widget Footer */}
      <div className="px-5 py-2.5 border-t border-slate-100 bg-slate-50/40 flex items-center justify-between text-xs">
        <span className="text-[11px] text-slate-500">
          Showing {displayItems.length} items needing reorder
        </span>
        <button
          onClick={() => onViewAll('Inventory & Stock')}
          className="font-medium text-sky-600 hover:text-sky-700 flex items-center gap-1 text-xs transition"
        >
          <span>View All</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}
