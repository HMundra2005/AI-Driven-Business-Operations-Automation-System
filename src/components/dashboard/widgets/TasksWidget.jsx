import React, { useState } from 'react';
import { CheckSquare, Clock, ArrowRight, ToggleLeft, ToggleRight, CheckCircle2, AlertCircle } from 'lucide-react';
import EmptyState from '../../common/EmptyState';

export default function TasksWidget({ items = [], onViewAll, onActionPlaceholder }) {
  const [tasks, setTasks] = useState(items);
  const [simulateEmpty, setSimulateEmpty] = useState(false);

  const toggleTask = (id) => {
    setTasks(prev => prev.map(t => {
      if (t.id === id) {
        const newStatus = t.status === 'Completed' ? 'Pending' : 'Completed';
        return { ...t, status: newStatus };
      }
      return t;
    }));
  };

  const displayItems = (simulateEmpty ? [] : tasks).slice(0, 3);

  return (
    <div className="flex flex-col h-full bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
      {/* Widget Header */}
      <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center">
            <CheckSquare className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-slate-800">Today's Tasks & Priorities</h3>
            <p className="text-[11px] text-slate-500">Scheduled operations & follow-ups</p>
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
            title="All tasks completed" 
            message="You have cleared all pending operational tasks for today."
            actionText="Simulate pending tasks"
            onAction={() => setSimulateEmpty(false)}
          />
        ) : (
          <div className="space-y-2">
            {displayItems.map((task) => {
              const isCompleted = task.status === 'Completed';
              const isHigh = task.priority === 'High';

              return (
                <div
                  key={task.id}
                  className={`p-3 rounded-lg border transition flex items-start gap-3 ${
                    isCompleted
                      ? 'bg-slate-50/40 border-slate-200 opacity-60'
                      : 'bg-white border-slate-200/90 hover:border-slate-300 shadow-2xs'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={isCompleted}
                    onChange={() => toggleTask(task.id)}
                    className="mt-0.5 w-4 h-4 rounded text-sky-600 focus:ring-sky-500 border-slate-300 cursor-pointer"
                  />

                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <p className={`text-xs font-medium text-slate-800 ${isCompleted ? 'line-through text-slate-400' : ''}`}>
                        {task.title}
                      </p>
                      <span
                        className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border flex-shrink-0 ${
                          isHigh
                            ? 'bg-rose-50 text-rose-700 border-rose-200'
                            : 'bg-slate-100 text-slate-600 border-slate-200'
                        }`}
                      >
                        {task.priority}
                      </span>
                    </div>

                    <div className="flex items-center gap-3 mt-1.5 text-[10px] text-slate-400">
                      <span className="flex items-center gap-1 font-mono">
                        <Clock className="w-3 h-3 text-slate-400" />
                        Due {task.dueTime}
                      </span>
                      <span>•</span>
                      <span>Assigned: {task.assignedTo}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Widget Footer */}
      <div className="px-5 py-2.5 border-t border-slate-100 bg-slate-50/40 flex items-center justify-between text-xs">
        <span className="text-[11px] text-slate-500">
          Showing {displayItems.filter(t => t.status !== 'Completed').length} pending tasks
        </span>
        <button
          onClick={() => onViewAll('Tasks & Follow-ups')}
          className="font-medium text-sky-600 hover:text-sky-700 flex items-center gap-1 text-xs transition"
        >
          <span>View All</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}
