import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import Sidebar from './components/layout/Sidebar';
import Header from './components/layout/Header';
import SummaryCards from './components/dashboard/SummaryCards';
import QuickActions from './components/dashboard/QuickActions';
import WidgetGrid from './components/dashboard/WidgetGrid';
import WidgetCustomizerModal from './components/dashboard/WidgetCustomizerModal';
import AiAssistantModal from './components/ai/AiAssistantModal';
import AuthModal from './components/auth/AuthModal';
import Toast from './components/common/Toast';
import InventoryOrdersView from './components/modules/inventory/InventoryOrdersView';
import CommunicationsView from './components/modules/communications/CommunicationsView';
import OperationsView from './components/modules/operations/OperationsView';
import { api } from './api/client';
import { DEFAULT_LAYOUT } from './data/mockData';

function DashboardApp() {
  const { user, isAuthenticated, loading: authLoading } = useAuth();

  // Navigation view state: 'dashboard' | 'inventory' | 'communications' | 'operations'
  const [currentView, setCurrentView] = useState('dashboard');

  // Sidebar state
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  // Widget Layout state (from backend API)
  const [widgetLayout, setWidgetLayout] = useState(DEFAULT_LAYOUT);
  const [isCustomizerOpen, setIsCustomizerOpen] = useState(false);

  // Modals state
  const [isAiAssistantOpen, setIsAiAssistantOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  // Live data from backend
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [summaryMetrics, setSummaryMetrics] = useState({
    pendingOrders: { value: 0, label: "Pending Orders", subtext: "Loading...", badge: "Checking", type: "orders" },
    lowStockItems: { value: 0, label: "Low-Stock Items", subtext: "Loading...", badge: "Checking", type: "inventory" },
    pendingApprovals: { value: 0, label: "Pending Approvals", subtext: "Loading...", badge: "Checking", type: "approvals" }
  });

  const [dashboardWidgetsData, setDashboardWidgetsData] = useState({
    inventory: [],
    approvals: [],
    communications: [],
    tasks: [],
    supplierFollowups: [],
    customerIssues: [],
    recentActivity: [],
    deadlines: [],
    orderStatus: [],
    completedTasks: []
  });

  // Toast notification state
  const [toast, setToast] = useState(null);

  const showToast = (title, message, type = 'info') => {
    setToast({ title, message, type });
  };

  // Load dashboard data from backend
  const fetchDashboardData = async () => {
    if (!isAuthenticated) return;
    setIsRefreshing(true);
    try {
      const [metricsRes, widgetsRes, layoutRes] = await Promise.all([
        api.dashboard.getSummary(),
        api.dashboard.getWidgets(),
        api.dashboard.getLayout().catch(() => ({ layout: DEFAULT_LAYOUT }))
      ]);

      if (metricsRes.metrics) setSummaryMetrics(metricsRes.metrics);
      if (widgetsRes) setDashboardWidgetsData(widgetsRes);
      if (layoutRes && layoutRes.layout) setWidgetLayout(layoutRes.layout);
    } catch (err) {
      console.warn('Backend live fetch warning:', err.message);
    } finally {
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      fetchDashboardData();
    }
  }, [isAuthenticated, user?.id]);

  const handleManualRefresh = async () => {
    await fetchDashboardData();
    showToast('Records Refreshed', 'Real-time database records and summary metrics reloaded from backend.', 'success');
  };

  const handleSaveLayout = async (newLayout) => {
    setWidgetLayout(newLayout);
    try {
      await api.dashboard.saveLayout(newLayout);
      showToast('Layout Saved', '2×2 Grid widget positions saved to your business profile.', 'success');
    } catch (err) {
      showToast('Layout Updated', 'Layout applied locally (backend sync pending).', 'info');
    }
  };

  // Quick Action triggers
  const handleQuickAction = (actionName) => {
    switch (actionName) {
      case 'Add Product':
      case 'Create Order':
        setCurrentView('inventory');
        showToast(actionName, 'Switched to Inventory & Orders management view.', 'info');
        break;
      case 'Review Emails':
        setCurrentView('communications');
        showToast(actionName, 'Switched to Email & Communication intelligence view.', 'info');
        break;
      case 'View Approvals':
      case 'Create Task / Follow-up':
        setCurrentView('operations');
        showToast(actionName, 'Switched to Daily Operations & Approvals center.', 'info');
        break;
      default:
        showToast(actionName, `${actionName} action is integrated into the core operations views.`, 'info');
    }
  };

  const handleViewAll = (sectionName) => {
    if (sectionName.includes('Inventory') || sectionName.includes('Stock') || sectionName.includes('Order')) {
      setCurrentView('inventory');
    } else if (sectionName.includes('Communication') || sectionName.includes('Email') || sectionName.includes('Customer Issues')) {
      setCurrentView('communications');
    } else {
      setCurrentView('operations');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-slate-800 antialiased selection:bg-sky-500 selection:text-white">
      {/* Sidebar Navigation */}
      <Sidebar
        currentView={currentView}
        onSelectView={setCurrentView}
        isCollapsed={isSidebarCollapsed}
        onToggleCollapse={() => setIsSidebarCollapsed(prev => !prev)}
        isMobileOpen={isMobileSidebarOpen}
        onCloseMobile={() => setIsMobileSidebarOpen(false)}
        onOpenAiAssistant={() => setIsAiAssistantOpen(true)}
        onOpenAuthModal={() => setIsAuthModalOpen(true)}
        onNotifyPlaceholder={(moduleName, desc) => showToast(moduleName, desc, 'info')}
      />

      {/* Main Content Area */}
      <div 
        className={`flex-1 flex flex-col transition-all duration-200 ease-in-out ${
          isSidebarCollapsed ? 'md:pl-16' : 'md:pl-64'
        }`}
      >
        {/* Header */}
        <Header
          currentView={currentView}
          onToggleMobileSidebar={() => setIsMobileSidebarOpen(true)}
          onRefresh={handleManualRefresh}
          isRefreshing={isRefreshing}
          onOpenCustomizer={() => setIsCustomizerOpen(true)}
          onOpenAuthModal={() => setIsAuthModalOpen(true)}
        />

        {/* Dynamic Views */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          {currentView === 'dashboard' && (
            <>
              {/* Active System Status Bar */}
              <div className="mb-4 px-3.5 py-2.5 rounded-lg bg-emerald-50 border border-emerald-200/90 text-emerald-900 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-1 shadow-2xs">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse"></span>
                  <span className="font-semibold">
                    Live Database Connected • Multi-Tenant Isolated Workspace ({user?.business_name || 'Apex Store'})
                  </span>
                </div>
                <span className="text-[11px] text-emerald-700 font-medium">
                  Each widget capped at maximum 3 priority items
                </span>
              </div>

              {/* Compact Summary Indicators Strip */}
              <SummaryCards 
                metrics={summaryMetrics} 
                onCardClick={(title) => {
                  if (title.includes('Order')) setCurrentView('inventory');
                  else if (title.includes('Stock')) setCurrentView('inventory');
                  else setCurrentView('operations');
                }}
              />

              {/* Quick Actions Bar */}
              <QuickActions onActionTriggered={handleQuickAction} />

              {/* Fixed 2x2 Dashboard Widget Grid */}
              <WidgetGrid
                layout={widgetLayout}
                onLayoutChange={handleSaveLayout}
                data={dashboardWidgetsData}
                onViewAll={handleViewAll}
                onActionPlaceholder={(act, desc) => showToast(act, desc, 'info')}
                onOpenCustomizer={() => setIsCustomizerOpen(true)}
              />
            </>
          )}

          {currentView === 'inventory' && (
            <InventoryOrdersView 
              onNotify={showToast} 
              onRefreshDashboard={fetchDashboardData} 
            />
          )}

          {currentView === 'communications' && (
            <CommunicationsView 
              onNotify={showToast} 
              onRefreshDashboard={fetchDashboardData} 
            />
          )}

          {currentView === 'operations' && (
            <OperationsView 
              onNotify={showToast} 
              onRefreshDashboard={fetchDashboardData} 
            />
          )}
        </main>

        {/* Global Footer */}
        <footer className="mt-auto py-4 px-6 border-t border-slate-200 bg-white text-center text-xs text-slate-500 flex flex-col sm:flex-row items-center justify-between gap-2">
          <p>AI-Driven Business Operations Automation System • JKLU CS1224 Project</p>
          <p className="text-[11px] text-slate-400">
            Current Workspace: <span className="font-semibold text-slate-600">{user?.business_name || 'Apex Wholesale & Retail'}</span> ({user?.email})
          </p>
        </footer>
      </div>

      {/* Widget Customizer Modal */}
      <WidgetCustomizerModal
        isOpen={isCustomizerOpen}
        onClose={() => setIsCustomizerOpen(false)}
        currentLayout={widgetLayout}
        onSaveLayout={handleSaveLayout}
      />

      {/* Floating AI Assistant Panel */}
      <AiAssistantModal
        isOpen={isAiAssistantOpen}
        onToggle={() => setIsAiAssistantOpen(prev => !prev)}
      />

      {/* Auth & Session Management Modal */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onNotify={showToast}
      />

      {/* Global Toast Notifications */}
      <Toast toast={toast} onClose={() => setToast(null)} />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <DashboardApp />
    </AuthProvider>
  );
}
