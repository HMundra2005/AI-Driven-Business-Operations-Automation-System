import React, { useState } from 'react';
import { X, SlidersHorizontal, RotateCcw, Check, Sparkles, AlertCircle } from 'lucide-react';
import { AVAILABLE_WIDGET_CONFIGS, DEFAULT_LAYOUT } from '../../data/mockData';

export default function WidgetCustomizerModal({ 
  isOpen, 
  onClose, 
  currentLayout, 
  onSaveLayout 
}) {
  const [layout, setLayout] = useState(currentLayout);
  const [message, setMessage] = useState('');

  // Keep local state in sync when opened
  React.useEffect(() => {
    if (isOpen) {
      setLayout(currentLayout);
      setMessage('');
    }
  }, [isOpen, currentLayout]);

  if (!isOpen) return null;

  const positionLabels = [
    { title: "Position 1 (Top-Left)", subtitle: "Primary focus area", defaultId: "inventory" },
    { title: "Position 2 (Top-Right)", subtitle: "Secondary critical stream", defaultId: "approvals" },
    { title: "Position 3 (Bottom-Left)", subtitle: "External communications & queries", defaultId: "communications" },
    { title: "Position 4 (Bottom-Right)", subtitle: "Execution & task progress", defaultId: "tasks" },
  ];

  const handleSelectWidget = (positionIndex, newWidgetId) => {
    setMessage('');
    // Check if newWidgetId is already assigned elsewhere
    const existingIndex = layout.findIndex((wId, idx) => wId === newWidgetId && idx !== positionIndex);
    
    if (existingIndex !== -1) {
      // Automatic swap to prevent duplicate selection
      const newLayout = [...layout];
      const previousWidget = newLayout[positionIndex];
      newLayout[positionIndex] = newWidgetId;
      newLayout[existingIndex] = previousWidget;
      setLayout(newLayout);
      setMessage(`Swapped "${AVAILABLE_WIDGET_CONFIGS.find(w => w.id === newWidgetId)?.title}" with "${AVAILABLE_WIDGET_CONFIGS.find(w => w.id === previousWidget)?.title}" to prevent duplicates.`);
    } else {
      const newLayout = [...layout];
      newLayout[positionIndex] = newWidgetId;
      setLayout(newLayout);
    }
  };

  const handleResetToDefault = () => {
    setLayout([...DEFAULT_LAYOUT]);
    setMessage('Reset to 4 default operational widgets.');
  };

  const handleSave = () => {
    onSaveLayout(layout);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl max-w-2xl w-full border border-slate-200 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-sky-100 text-sky-700 flex items-center justify-center">
              <SlidersHorizontal className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">Customize Dashboard Grid</h2>
              <p className="text-xs text-slate-500">
                Configure your fixed 2×2 desktop widget positions (Prototype state)
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-5">
          <div className="p-3 bg-sky-50 border border-sky-200 rounded-xl text-xs text-sky-900 flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 text-sky-600 mt-0.5 flex-shrink-0" />
            <div>
              <p className="font-semibold">Duplicate Prevention Active</p>
              <p className="mt-0.5 text-sky-800">
                Each widget can only appear once in the 2×2 grid. Selecting a widget that is already assigned elsewhere will automatically swap positions.
              </p>
            </div>
          </div>

          {message && (
            <div className="text-xs px-3 py-2 rounded-lg bg-amber-50 border border-amber-200 text-amber-900 font-medium animate-in fade-in">
              {message}
            </div>
          )}

          {/* 4 Positions Form */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {positionLabels.map((pos, index) => {
              const currentSelectedId = layout[index];
              const currentConfig = AVAILABLE_WIDGET_CONFIGS.find(w => w.id === currentSelectedId);

              return (
                <div key={index} className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-white hover:border-sky-300 transition shadow-2xs">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-slate-800">
                      {pos.title}
                    </span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-200/70 text-slate-700">
                      Grid Slot {index + 1}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 mb-3">{pos.subtitle}</p>

                  <select
                    value={currentSelectedId}
                    onChange={(e) => handleSelectWidget(index, e.target.value)}
                    className="w-full text-xs font-medium rounded-lg border border-slate-300 bg-white py-2 px-3 text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500 shadow-2xs cursor-pointer"
                  >
                    {AVAILABLE_WIDGET_CONFIGS.map((widget) => {
                      const isAssignedElsewhere = layout.some((assignedId, aIdx) => assignedId === widget.id && aIdx !== index);
                      const assignedIndex = layout.findIndex((assignedId, aIdx) => assignedId === widget.id && aIdx !== index);

                      return (
                        <option key={widget.id} value={widget.id}>
                          {widget.title} {isAssignedElsewhere ? `(Swaps with Slot ${assignedIndex + 1})` : ''}
                        </option>
                      );
                    })}
                  </select>

                  <div className="mt-2 text-[11px] text-slate-500 line-clamp-2">
                    {currentConfig?.description}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
          <button
            onClick={handleResetToDefault}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 text-xs font-medium text-slate-700 transition"
          >
            <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
            <span>Reset to Default Layout</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-lg text-xs font-medium text-slate-600 hover:text-slate-800 hover:bg-slate-200/60 transition"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="px-4 py-2 rounded-lg text-xs font-semibold text-white bg-sky-600 hover:bg-sky-700 transition flex items-center gap-1.5 shadow-sm"
            >
              <Check className="w-4 h-4" />
              <span>Apply Changes</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
