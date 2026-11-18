import React from 'react';
import InventoryWidget from './widgets/InventoryWidget';
import ApprovalsWidget from './widgets/ApprovalsWidget';
import CommunicationsWidget from './widgets/CommunicationsWidget';
import TasksWidget from './widgets/TasksWidget';
import SupplierFollowupsWidget from './widgets/SupplierFollowupsWidget';
import CustomerIssuesWidget from './widgets/CustomerIssuesWidget';
import RecentActivityWidget from './widgets/RecentActivityWidget';
import DeadlinesWidget from './widgets/DeadlinesWidget';
import OrderStatusWidget from './widgets/OrderStatusWidget';
import CompletedTasksWidget from './widgets/CompletedTasksWidget';

export default function WidgetRenderer({ 
  widgetId, 
  data, 
  onViewAll, 
  onActionPlaceholder 
}) {
  switch (widgetId) {
    case 'inventory':
      return <InventoryWidget items={data.inventory} onViewAll={onViewAll} />;
    case 'approvals':
      return <ApprovalsWidget items={data.approvals} onViewAll={onViewAll} onActionPlaceholder={onActionPlaceholder} />;
    case 'communications':
      return <CommunicationsWidget items={data.communications} onViewAll={onViewAll} onActionPlaceholder={onActionPlaceholder} />;
    case 'tasks':
      return <TasksWidget items={data.tasks} onViewAll={onViewAll} onActionPlaceholder={onActionPlaceholder} />;
    case 'supplier-followups':
      return <SupplierFollowupsWidget items={data.supplierFollowups} onViewAll={onViewAll} onActionPlaceholder={onActionPlaceholder} />;
    case 'customer-issues':
      return <CustomerIssuesWidget items={data.customerIssues} onViewAll={onViewAll} onActionPlaceholder={onActionPlaceholder} />;
    case 'recent-activity':
      return <RecentActivityWidget items={data.recentActivity} onViewAll={onViewAll} />;
    case 'upcoming-deadlines':
      return <DeadlinesWidget items={data.deadlines} onViewAll={onViewAll} />;
    case 'order-status':
      return <OrderStatusWidget items={data.orderStatus} onViewAll={onViewAll} />;
    case 'completed-tasks':
      return <CompletedTasksWidget items={data.completedTasks} onViewAll={onViewAll} />;
    default:
      return (
        <div className="p-8 text-center text-sm text-slate-500 bg-white rounded-xl border border-dashed border-slate-300">
          Unknown widget type: {widgetId}
        </div>
      );
  }
}
