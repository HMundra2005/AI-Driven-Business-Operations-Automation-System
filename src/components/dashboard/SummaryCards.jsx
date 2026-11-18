import React from 'react';
import { ShoppingCart, AlertCircle, ShieldAlert, ArrowUpRight } from 'lucide-react';

export default function SummaryCards({ metrics, onCardClick }) {
  const cards = [
    {
      id: 'pendingOrders',
      title: 'Pending Orders',
      value: metrics.pendingOrders.value,
      subtext: metrics.pendingOrders.subtext,
      badge: metrics.pendingOrders.badge,
      badgeColor: 'bg-sky-50 text-sky-700 border-sky-200',
      iconBg: 'bg-sky-100 text-sky-700',
      icon: ShoppingCart,
      visualCue: 'border-l-4 border-l-sky-500',
    },
    {
      id: 'lowStockItems',
      title: 'Low-Stock Items',
      value: metrics.lowStockItems.value,
      subtext: metrics.lowStockItems.subtext,
      badge: metrics.lowStockItems.badge,
      badgeColor: 'bg-amber-50 text-amber-700 border-amber-200',
      iconBg: 'bg-amber-100 text-amber-700',
      icon: AlertCircle,
      visualCue: 'border-l-4 border-l-amber-500',
    },
    {
      id: 'pendingApprovals',
      title: 'Pending Approvals',
      value: metrics.pendingApprovals.value,
      subtext: metrics.pendingApprovals.subtext,
      badge: metrics.pendingApprovals.badge,
      badgeColor: 'bg-purple-50 text-purple-700 border-purple-200',
      iconBg: 'bg-purple-100 text-purple-700',
      icon: ShieldAlert,
      visualCue: 'border-l-4 border-l-purple-500',
    },
  ];

  return (
    <div className="mb-6">
      {/* Subtle indicator bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {cards.map((card) => {
          const Icon = card.icon;
          return (
            <div
              key={card.id}
              onClick={() => onCardClick(card.title)}
              className={`bg-white rounded-xl p-4 border border-slate-200/90 shadow-xs hover:shadow-sm transition cursor-pointer group ${card.visualCue}`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-slate-500 tracking-wide uppercase">
                  {card.title}
                </span>
                <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${card.badgeColor}`}>
                  {card.badge}
                </span>
              </div>

              <div className="mt-2.5 flex items-baseline justify-between">
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
                    {card.value}
                  </span>
                  <span className="text-xs text-slate-500">items</span>
                </div>
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${card.iconBg} group-hover:scale-105 transition-transform`}>
                  <Icon className="w-4 h-4" />
                </div>
              </div>

              <p className="mt-2 text-xs text-slate-500 truncate">
                {card.subtext}
              </p>
            </div>
          );
        })}
      </div>
      
      {/* Prototype Notice Pill */}
      <div className="mt-2 text-right">
        <span className="text-[11px] text-slate-400 italic">
          * Summary metrics are mock prototype figures for demonstration.
        </span>
      </div>
    </div>
  );
}
