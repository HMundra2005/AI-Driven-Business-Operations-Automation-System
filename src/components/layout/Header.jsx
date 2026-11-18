import React from 'react';
import { 
  RotateCw, 
  Menu, 
  SlidersHorizontal, 
  Calendar, 
  Store,
  UserCheck
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export default function Header({ 
  currentView = 'dashboard',
  onToggleMobileSidebar, 
  onRefresh, 
  isRefreshing, 
  onOpenCustomizer,
  onOpenAuthModal
}) {
  const { user } = useAuth();

  const formattedDate = new Date().toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  const viewTitles = {
    dashboard: 'Dashboard',
    inventory: 'Inventory & Order Management',
    communications: 'Email & Communication Intelligence',
    operations: 'Daily Operations & Approvals Center',
  };

  const viewSubtitles = {
    dashboard: `Daily overview & operational indicators for ${user?.business_name || user?.businessName || 'Apex Wholesale & Retail'}`,
    inventory: 'Real-time stock balance, automated deficit detection, and customer orders',
    communications: 'Automated incoming email processing, classification, and reply drafting',
    operations: 'High-stakes owner approvals, priority follow-ups, and operational tasks',
  };

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-20 shadow-xs">
      <div className="px-4 sm:px-6 lg:px-8 py-3.5 flex items-center justify-between gap-4">
        {/* Left Side: Mobile Menu Button & View Title */}
        <div className="flex items-center gap-3 min-w-0">
          <button
            onClick={onToggleMobileSidebar}
            className="md:hidden p-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition"
            aria-label="Open mobile menu"
          >
            <Menu className="w-5 h-5" />
          </button>

          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h1 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight truncate">
                {viewTitles[currentView] || 'Dashboard'}
              </h1>
              <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200 flex-shrink-0">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-1.5"></span>
                System Live
              </span>
            </div>
            <p className="text-xs text-slate-500 truncate hidden sm:block">
              {viewSubtitles[currentView]}
            </p>
          </div>
        </div>

        {/* Right Side: Actions, Refresh, Customizer & Profile */}
        <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
          {/* Current Date Display */}
          <div className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-50 border border-slate-200 text-slate-600 text-xs font-medium">
            <Calendar className="w-3.5 h-3.5 text-slate-400" />
            <span>{formattedDate}</span>
          </div>

          {/* Widget Layout Customizer Button (visible on dashboard) */}
          {currentView === 'dashboard' && (
            <button
              onClick={onOpenCustomizer}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-medium transition shadow-xs"
              title="Configure Dashboard Widgets"
            >
              <SlidersHorizontal className="w-3.5 h-3.5 text-slate-500" />
              <span className="hidden sm:inline">Customize 2×2 Grid</span>
            </button>
          )}

          {/* Manual Refresh Button */}
          <button
            onClick={onRefresh}
            disabled={isRefreshing}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-medium transition shadow-xs disabled:opacity-60"
            title="Refresh database records"
          >
            <RotateCw className={`w-3.5 h-3.5 text-slate-500 ${isRefreshing ? 'animate-spin text-sky-600' : ''}`} />
            <span className="hidden sm:inline">{isRefreshing ? 'Refreshing...' : 'Refresh'}</span>
          </button>

          {/* Profile / Avatar Area with click to manage session */}
          <button
            onClick={onOpenAuthModal}
            className="flex items-center gap-2 pl-2 sm:pl-3 border-l border-slate-200 text-left hover:opacity-80 transition"
            title="Manage business session / Switch accounts"
          >
            <div className="w-8 h-8 rounded-full bg-slate-800 text-white flex items-center justify-center font-bold text-xs shadow-xs">
              {user?.business_name ? user.business_name.substring(0, 2).toUpperCase() : 'AP'}
            </div>
            <div className="hidden xl:block">
              <p className="text-xs font-semibold text-slate-800 leading-none truncate max-w-[120px]">
                {user?.business_name || user?.businessName || 'Apex Store'}
              </p>
              <p className="text-[10px] text-slate-500 mt-0.5 truncate">
                {user?.email || 'demo@opsautomate.com'}
              </p>
            </div>
          </button>
        </div>
      </div>
    </header>
  );
}
