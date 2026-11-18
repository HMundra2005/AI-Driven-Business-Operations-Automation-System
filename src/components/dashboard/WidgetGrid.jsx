import React from 'react';
import WidgetRenderer from './WidgetRenderer';
import { AVAILABLE_WIDGET_CONFIGS } from '../../data/mockData';
import { ArrowLeftRight, Settings2 } from 'lucide-react';

export default function WidgetGrid({ 
  layout, 
  onLayoutChange, 
  data, 
  onViewAll, 
  onActionPlaceholder,
  onOpenCustomizer 
}) {
  const positionMetadata = [
    { label: "Position 1 (Top-Left)", slot: 1 },
    { label: "Position 2 (Top-Right)", slot: 2 },
    { label: "Position 3 (Bottom-Left)", slot: 3 },
    { label: "Position 4 (Bottom-Right)", slot: 4 },
  ];

  // Quick swap from dropdown on individual widget header
  const handleDirectSelect = (positionIndex, newWidgetId) => {
    const existingIndex = layout.findIndex((wId, idx) => wId === newWidgetId && idx !== positionIndex);
    const newLayout = [...layout];
    if (existingIndex !== -1) {
      // Swap to prevent duplicate
      const currentWidget = newLayout[positionIndex];
      newLayout[positionIndex] = newWidgetId;
      newLayout[existingIndex] = currentWidget;
    } else {
      newLayout[positionIndex] = newWidgetId;
    }
    onLayoutChange(newLayout);
  };

  return (
    <div className="space-y-3">
      {/* Grid Header Info */}
      <div className="flex items-center justify-between text-xs text-slate-500">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-slate-700">Fixed 2×2 Operational Grid</span>
          <span className="text-[11px] px-2 py-0.5 rounded-full bg-slate-200/70 text-slate-600">
            4 Configurable Slots
          </span>
        </div>
        <button
          onClick={onOpenCustomizer}
          className="text-sky-600 hover:text-sky-700 font-medium flex items-center gap-1 hover:underline text-xs"
        >
          <Settings2 className="w-3.5 h-3.5" />
          <span>Customize Layout</span>
        </button>
      </div>

      {/* Fixed 2x2 Grid (Desktop: 2 columns, 2 rows; Mobile: 1 column stacked) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {layout.map((widgetId, index) => {
          const meta = positionMetadata[index];
          const config = AVAILABLE_WIDGET_CONFIGS.find(w => w.id === widgetId);

          return (
            <div 
              key={`${widgetId}-${index}`} 
              className="flex flex-col rounded-2xl border border-slate-200/80 bg-slate-100/50 p-1.5 transition duration-200 hover:border-slate-300"
            >
              {/* Position bar */}
              <div className="px-3 py-1.5 flex items-center justify-between text-[11px] text-slate-500 mb-1">
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-sky-500"></span>
                  <span className="font-semibold text-slate-700">{meta.label}</span>
                </div>

                {/* Quick Widget Switcher dropdown */}
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] text-slate-400">Switch:</span>
                  <select
                    value={widgetId}
                    onChange={(e) => handleDirectSelect(index, e.target.value)}
                    className="text-[11px] font-medium bg-white border border-slate-200 rounded px-2 py-0.5 text-slate-700 focus:outline-none focus:ring-1 focus:ring-sky-500 cursor-pointer shadow-2xs"
                    title="Change widget in this position"
                  >
                    {AVAILABLE_WIDGET_CONFIGS.map((w) => {
                      const isAssigned = layout.some((assignedId, aIdx) => assignedId === w.id && aIdx !== index);
                      return (
                        <option key={w.id} value={w.id}>
                          {w.title} {isAssigned ? '(Swap)' : ''}
                        </option>
                      );
                    })}
                  </select>
                </div>
              </div>

              {/* Render the actual widget */}
              <div className="flex-1">
                <WidgetRenderer
                  widgetId={widgetId}
                  data={data}
                  onViewAll={onViewAll}
                  onActionPlaceholder={onActionPlaceholder}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
