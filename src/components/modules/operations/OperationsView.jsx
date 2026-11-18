import React, { useState, useEffect } from 'react';
import { 
  CheckSquare, 
  ShieldCheck, 
  Plus, 
  Clock, 
  RotateCw, 
  CheckCircle2, 
  XCircle, 
  AlertCircle,
  Sparkles,
  Calendar
} from 'lucide-react';
import { api } from '../../../api/client';

export default function OperationsView({ onNotify, onRefreshDashboard }) {
  const [approvals, setApprovals] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);

  // New Task Modal State
  const [showAddTask, setShowAddTask] = useState(false);
  const [newTask, setNewTask] = useState({
    title: '',
    priority: 'Medium',
    dueTime: '04:00 PM',
    category: 'Operations',
    assignedTo: 'Owner'
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const [apprRes, taskRes] = await Promise.all([
        api.approvals.getApprovals(),
        api.tasks.getTasks()
      ]);
      setApprovals(apprRes.approvals || []);
      setTasks(taskRes.tasks || []);
    } catch (err) {
      onNotify('Error Loading Operations', err.message, 'warning');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleApprove = async (approvalId, title) => {
    try {
      const res = await api.approvals.approve(approvalId);
      onNotify('Action Approved', res.message, 'success');
      fetchData();
      if (onRefreshDashboard) onRefreshDashboard();
    } catch (err) {
      onNotify('Approval Failed', err.message, 'warning');
    }
  };

  const handleReject = async (approvalId, title) => {
    try {
      const res = await api.approvals.reject(approvalId, 'Dismissed by store owner during review');
      onNotify('Action Rejected', res.message, 'info');
      fetchData();
      if (onRefreshDashboard) onRefreshDashboard();
    } catch (err) {
      onNotify('Rejection Failed', err.message, 'warning');
    }
  };

  const handleToggleTask = async (taskId) => {
    try {
      const res = await api.tasks.toggleTask(taskId);
      setTasks(prev => prev.map(t => t.id === taskId ? res.task : t));
      if (onRefreshDashboard) onRefreshDashboard();
    } catch (err) {
      onNotify('Task Update Failed', err.message, 'warning');
    }
  };

  const handleDeleteTask = async (taskId) => {
    try {
      await api.tasks.deleteTask(taskId);
      setTasks(prev => prev.filter(t => t.id !== taskId));
      onNotify('Task Removed', 'Task cleared from daily checklist.', 'info');
      if (onRefreshDashboard) onRefreshDashboard();
    } catch (err) {
      onNotify('Delete Failed', err.message, 'warning');
    }
  };

  const handleCreateTask = async (e) => {
    e.preventDefault();
    try {
      const res = await api.tasks.createTask(newTask);
      onNotify('Task Created', `Added: "${newTask.title}"`, 'success');
      setShowAddTask(false);
      setNewTask({
        title: '',
        priority: 'Medium',
        dueTime: '04:00 PM',
        category: 'Operations',
        assignedTo: 'Owner'
      });
      fetchData();
      if (onRefreshDashboard) onRefreshDashboard();
    } catch (err) {
      onNotify('Failed to Create Task', err.message, 'warning');
    }
  };

  const pendingApprovals = approvals.filter(a => a.status === 'Pending');

  return (
    <div className="space-y-6">
      {/* Module Header Bar */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-sky-100 text-sky-700 flex items-center justify-center font-bold">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <h2 className="text-lg font-bold text-slate-900">Daily Operations & Approvals Center</h2>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Consolidated operational priorities, pending owner approvals, and staff action checklists.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowAddTask(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-sky-600 hover:bg-sky-700 text-white text-xs font-semibold shadow-xs transition"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Create Task</span>
          </button>

          <button
            onClick={fetchData}
            className="p-2 rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
            title="Refresh operations"
          >
            <RotateCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left Column: Pending Owner Approvals (High-Stakes Decisions) */}
        <div className="lg:col-span-6 bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden flex flex-col">
          <div className="px-5 py-3.5 border-b border-slate-100 bg-purple-50/50 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-purple-700" />
              <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                Pending Owner Approvals ({pendingApprovals.length})
              </span>
            </div>
            <span className="text-[10px] text-purple-700 font-semibold bg-purple-100 px-2 py-0.5 rounded-full">
              Human-in-the-Loop
            </span>
          </div>

          <div className="p-4 flex-1 divide-y divide-slate-100 space-y-3">
            {pendingApprovals.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-400">
                All caught up! No actions currently awaiting owner authorization.
              </div>
            ) : (
              pendingApprovals.map((appr) => {
                const isHigh = appr.urgency === 'High';
                return (
                  <div key={appr.id} className="pt-3 first:pt-0">
                    <div className="p-3.5 rounded-lg border border-slate-200 bg-slate-50/50 hover:bg-slate-50 transition flex flex-col gap-2">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-purple-100 text-purple-800 font-bold">
                              {appr.type}
                            </span>
                            <span className="text-xs font-bold text-slate-900">{appr.title}</span>
                          </div>
                          <p className="text-xs text-slate-600 mt-1">{appr.details}</p>
                        </div>
                        <div className="text-right flex-shrink-0">
                          {appr.amount && (
                            <span className="text-xs font-bold text-slate-900 block">{appr.amount}</span>
                          )}
                          <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded ${
                            isHigh ? 'bg-rose-100 text-rose-800' : 'bg-slate-100 text-slate-600'
                          }`}>
                            {appr.urgency}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-2 border-t border-slate-200/60 text-[10px] text-slate-400">
                        <span>Requested by: <strong className="text-slate-600">{appr.requested_by}</strong></span>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleReject(appr.id, appr.title)}
                            className="px-2.5 py-1 rounded bg-white hover:bg-rose-50 text-rose-700 border border-rose-200 font-semibold transition"
                          >
                            Reject
                          </button>
                          <button
                            onClick={() => handleApprove(appr.id, appr.title)}
                            className="px-3 py-1 rounded bg-sky-600 hover:bg-sky-700 text-white font-semibold shadow-xs transition"
                          >
                            Approve & Execute
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right Column: Daily Operational Tasks & Priorities */}
        <div className="lg:col-span-6 bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden flex flex-col">
          <div className="px-5 py-3.5 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckSquare className="w-4 h-4 text-emerald-600" />
              <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                Today's Tasks & Checklists ({tasks.filter(t => t.status === 'Pending').length} Pending)
              </span>
            </div>
            <button
              onClick={() => setShowAddTask(true)}
              className="text-xs font-semibold text-sky-600 hover:text-sky-700 flex items-center gap-1"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add</span>
            </button>
          </div>

          <div className="p-4 flex-1 space-y-2 overflow-y-auto max-h-[500px]">
            {tasks.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-400">No tasks created yet.</div>
            ) : (
              tasks.map((task) => {
                const isCompleted = task.status === 'Completed';
                const isHigh = task.priority === 'High';

                return (
                  <div
                    key={task.id}
                    className={`p-3 rounded-lg border transition flex items-start gap-3 ${
                      isCompleted
                        ? 'bg-slate-50/50 border-slate-200 opacity-60'
                        : 'bg-white border-slate-200/90 shadow-2xs hover:border-slate-300'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={isCompleted}
                      onChange={() => handleToggleTask(task.id)}
                      className="mt-0.5 w-4 h-4 rounded text-sky-600 focus:ring-sky-500 border-slate-300 cursor-pointer"
                    />

                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <p className={`text-xs font-semibold ${isCompleted ? 'line-through text-slate-400' : 'text-slate-800'}`}>
                          {task.title}
                        </p>
                        <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded-full border flex-shrink-0 ${
                          isHigh ? 'bg-rose-50 text-rose-700 border-rose-200' : 'bg-slate-100 text-slate-600 border-slate-200'
                        }`}>
                          {task.priority}
                        </span>
                      </div>

                      <div className="flex items-center justify-between mt-1 text-[10px] text-slate-400">
                        <div className="flex items-center gap-2">
                          <span className="flex items-center gap-1 font-mono">
                            <Clock className="w-2.5 h-2.5" />
                            {task.due_time}
                          </span>
                          <span>•</span>
                          <span>Assigned: {task.assigned_to}</span>
                        </div>
                        <button
                          onClick={() => handleDeleteTask(task.id)}
                          className="text-slate-400 hover:text-rose-600 transition"
                          title="Delete task"
                        >
                          ✕
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* Add Task Modal */}
      {showAddTask && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full border border-slate-200 shadow-2xl p-6">
            <h3 className="text-base font-bold text-slate-800 mb-4">Create Operational Task</h3>
            <form onSubmit={handleCreateTask} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Task Title / Action Item</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Call transporter regarding delayed delivery manifest"
                  value={newTask.title}
                  onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                  className="w-full text-xs p-2 border border-slate-300 rounded-lg"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Priority</label>
                  <select
                    value={newTask.priority}
                    onChange={(e) => setNewTask({ ...newTask, priority: e.target.value })}
                    className="w-full text-xs p-2 border border-slate-300 rounded-lg bg-white"
                  >
                    <option value="High">High</option>
                    <option value="Medium">Medium</option>
                    <option value="Normal">Normal</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Due Time</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 02:00 PM"
                    value={newTask.dueTime}
                    onChange={(e) => setNewTask({ ...newTask, dueTime: e.target.value })}
                    className="w-full text-xs p-2 border border-slate-300 rounded-lg"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Category</label>
                  <input
                    type="text"
                    value={newTask.category}
                    onChange={(e) => setNewTask({ ...newTask, category: e.target.value })}
                    className="w-full text-xs p-2 border border-slate-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Assigned To</label>
                  <input
                    type="text"
                    value={newTask.assignedTo}
                    onChange={(e) => setNewTask({ ...newTask, assignedTo: e.target.value })}
                    className="w-full text-xs p-2 border border-slate-300 rounded-lg"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setShowAddTask(false)}
                  className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-semibold text-white bg-sky-600 hover:bg-sky-700 rounded-lg shadow-xs"
                >
                  Add Task
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
