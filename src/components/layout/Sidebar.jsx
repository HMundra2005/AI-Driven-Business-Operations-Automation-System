import React from 'react';
import { 
  LayoutDashboard, 
  Boxes, 
  ShoppingCart, 
  Users, 
  MessageSquareText, 
  CheckSquare, 
  ShieldCheck, 
  Bot, 
  Settings, 
  ChevronLeft, 
  ChevronRight, 
  Store,
  LogOut,
  X
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export const NAVIGATION_ITEMS = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, view: 'dashboard' },
  { id: 'inventory', label: 'Inventory & Stock', icon: Boxes, view: 'inventory' },
  { id: 'orders', label: 'Orders', icon: ShoppingCart, view: 'inventory' },
  { id: 'communications', label: 'Communications', icon: MessageSquareText, view: 'communications' },
  { id: 'tasks', label: 'Tasks & Follow-ups', icon: CheckSquare, view: 'operations' },
  { id: 'approvals', label: 'Approvals', icon: ShieldCheck, view: 'operations' },
  { id: 'ai-assistant', label: 'AI Assistant', icon: Bot, isAiShortcut: true },
  { id: 'customers-suppliers', label: 'Customers & Suppliers', icon: Users, isPlaceholder: true },
  { id: 'settings', label: 'Settings', icon: Settings, isPlaceholder: true },
];

export default function Sidebar({ 
  currentView = 'dashboard',
  onSelectView,
  isCollapsed, 
  onToggleCollapse, 
  isMobileOpen, 
  onCloseMobile,
  onOpenAiAssistant,
  onOpenAuthModal,
  onNotifyPlaceholder
}) {
  const { user } = useAuth();

  const handleNavClick = (item, e) => {
    e.preventDefault();
    if (item.isAiShortcut) {
      if (onCloseMobile) onCloseMobile();
      onOpenAiAssistant();
      return;
    }

    if (item.isPlaceholder) {
      onNotifyPlaceholder(
        item.label, 
        `The "${item.label}" direct management view is consolidated into the core Inventory and Operations tabs.`
      );
      if (onCloseMobile) onCloseMobile();
      return;
    }

    if (item.view) {
      onSelectView(item.view);
      if (onCloseMobile) onCloseMobile();
    }
  };

  const sidebarContent = (
    <div className="flex flex-col h-full bg-slate-900 text-slate-200 border-r border-slate-800">
      {/* Brand Header */}
      <div className="h-16 flex items-center justify-between px-4 border-b border-slate-800">
        <div className="flex items-center gap-3 overflow-hidden">
          <div className="w-9 h-9 rounded-lg bg-sky-600 flex items-center justify-center flex-shrink-0 text-white font-bold shadow-md shadow-sky-600/30">
            <Store className="w-5 h-5" />
          </div>
          {(!isCollapsed || isMobileOpen) && (
            <div className="flex flex-col min-w-0">
              <span className="font-semibold text-sm tracking-tight text-white truncate">
                OpsAutomate
              </span>
              <span className="text-[11px] text-slate-400 truncate">
                Retail & Wholesale AI
              </span>
            </div>
          )}
        </div>

        {/* Desktop Collapse Button */}
        <button
          onClick={onToggleCollapse}
          className="hidden md:flex p-1.5 rounded-md text-slate-400 hover:text-white hover:bg-slate-800 transition"
          title={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>

        {/* Mobile Close Button */}
        <button
          onClick={onCloseMobile}
          className="md:hidden p-1.5 rounded-md text-slate-400 hover:text-white hover:bg-slate-800"
          aria-label="Close sidebar"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Navigation List */}
      <nav className="flex-1 py-4 px-2 space-y-1 overflow-y-auto">
        <div className="px-2 pb-2 text-[10px] font-semibold tracking-wider uppercase text-slate-500">
          {(!isCollapsed || isMobileOpen) && <span>Operations Menu</span>}
        </div>

        {NAVIGATION_ITEMS.map((item) => {
          const Icon = item.icon;
          const isSelected = item.view === currentView && !item.isPlaceholder && !item.isAiShortcut;

          return (
            <button
              key={item.id}
              onClick={(e) => handleNavClick(item, e)}
              title={isCollapsed && !isMobileOpen ? item.label : undefined}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-medium transition-colors text-left group relative ${
                isSelected
                  ? 'bg-sky-600/20 text-sky-400 border border-sky-500/40 shadow-sm'
                  : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/60'
              }`}
            >
              <Icon
                className={`w-4 h-4 flex-shrink-0 transition-transform ${
                  isSelected ? 'text-sky-400' : 'text-slate-400 group-hover:text-slate-200'
                }`}
              />

              {(!isCollapsed || isMobileOpen) && (
                <div className="flex items-center justify-between flex-1 min-w-0">
                  <span className="truncate">{item.label}</span>
                  {isSelected ? (
                    <span className="inline-block w-1.5 h-1.5 rounded-full bg-sky-400"></span>
                  ) : item.isPlaceholder ? (
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-500">
                      Planned
                    </span>
                  ) : item.isAiShortcut ? (
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-sky-950 text-sky-300 font-semibold border border-sky-800/50">
                      Assistant
                    </span>
                  ) : null}
                </div>
              )}

              {/* Collapsed Tooltip */}
              {isCollapsed && !isMobileOpen && (
                <div className="absolute left-full ml-2 px-2 py-1 bg-slate-950 text-slate-200 text-xs rounded shadow-lg whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity z-50">
                  {item.label}
                </div>
              )}
            </button>
          );
        })}
      </nav>

      {/* Footer Store Info & Session Manager */}
      <div className="p-3 border-t border-slate-800 bg-slate-950/40">
        <div className="flex items-center justify-between">
          <div 
            onClick={onOpenAuthModal}
            className="flex items-center gap-2.5 cursor-pointer hover:opacity-80 transition min-w-0 flex-1"
            title="Click to view session or switch accounts"
          >
            <div className="w-8 h-8 rounded-full bg-sky-600 border border-sky-500 flex items-center justify-center text-xs font-bold text-white flex-shrink-0">
              {user?.business_name ? user.business_name.substring(0, 2).toUpperCase() : 'AW'}
            </div>
            {(!isCollapsed || isMobileOpen) && (
              <div className="min-w-0 flex-1">
                <p className="text-xs font-semibold text-slate-200 truncate">
                  {user?.business_name || user?.businessName || 'Apex Wholesale & Retail'}
                </p>
                <p className="text-[10px] text-slate-400 truncate">
                  {user?.email || 'demo@opsautomate.com'}
                </p>
              </div>
            )}
          </div>

          {(!isCollapsed || isMobileOpen) && (
            <button
              onClick={onOpenAuthModal}
              className="p-1 rounded text-slate-500 hover:text-slate-200 hover:bg-slate-800 transition"
              title="Switch user account"
            >
              <LogOut className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <aside
        className={`hidden md:block fixed top-0 left-0 bottom-0 z-30 transition-all duration-200 ease-in-out ${
          isCollapsed ? 'w-16' : 'w-64'
        }`}
      >
        {sidebarContent}
      </aside>

      {/* Mobile Drawer Backdrop */}
      {isMobileOpen && (
        <div
          onClick={onCloseMobile}
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 md:hidden animate-in fade-in duration-150"
          aria-hidden="true"
        />
      )}

      {/* Mobile Drawer */}
      <div
        className={`fixed top-0 bottom-0 left-0 w-72 max-w-[85vw] z-50 md:hidden transform transition-transform duration-200 ease-in-out ${
          isMobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {sidebarContent}
      </div>
    </>
  );
}
