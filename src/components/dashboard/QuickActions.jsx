import React from 'react';
import { 
  PackagePlus, 
  ShoppingCart, 
  Mail, 
  ShieldCheck, 
  CalendarPlus, 
  UserPlus 
} from 'lucide-react';

export default function QuickActions({ onActionTriggered }) {
  const actions = [
    { id: 'add-product', label: 'Add Product', icon: PackagePlus },
    { id: 'create-order', label: 'Create Order', icon: ShoppingCart },
    { id: 'review-emails', label: 'Review Emails', icon: Mail },
    { id: 'view-approvals', label: 'View Approvals', icon: ShieldCheck },
    { id: 'create-task', label: 'Create Task / Follow-up', icon: CalendarPlus },
    { id: 'add-entity', label: 'Add Customer / Supplier', icon: UserPlus },
  ];

  return (
    <div className="bg-white rounded-xl border border-slate-200/90 p-4 mb-6 shadow-xs">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 mb-3 border-b border-slate-100">
        <div>
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
            Quick Actions
          </h3>
          <p className="text-[11px] text-slate-500">
            Common business shortcuts (Prototype Placeholders)
          </p>
        </div>
        <span className="text-[10px] font-medium px-2 py-0.5 rounded bg-slate-100 text-slate-600 self-start sm:self-auto">
          Frontend Demo Mode
        </span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
        {actions.map((act) => {
          const Icon = act.icon;
          return (
            <button
              key={act.id}
              onClick={() => onActionTriggered(act.label)}
              className="flex items-center gap-2 px-3 py-2.5 rounded-lg border border-slate-200/80 bg-slate-50/60 hover:bg-sky-50/80 hover:border-sky-300 hover:text-sky-800 text-slate-700 text-xs font-medium transition text-left group shadow-2xs"
            >
              <Icon className="w-3.5 h-3.5 text-slate-500 group-hover:text-sky-600 flex-shrink-0" />
              <span className="truncate">{act.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
