import React, { useState } from 'react';
import { X, Lock, Mail, Store, UserPlus, LogIn, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export default function AuthModal({ isOpen, onClose, onNotify }) {
  const { user, login, register, logout, isAuthenticated } = useAuth();
  const [mode, setMode] = useState('login'); // 'login' | 'register'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [businessName, setBusinessName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (mode === 'login') {
        await login(email, password);
        onNotify('Welcome Back', 'Logged in successfully. Isolated business workspace loaded.', 'success');
        onClose();
      } else {
        await register(businessName, email, password);
        onNotify('Account Created', `Workspace for "${businessName}" initialized with isolated starter data.`, 'success');
        onClose();
      }
    } catch (err) {
      setError(err.message || 'Operation failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleDemoLogin = async () => {
    setError('');
    setLoading(true);
    try {
      await login('demo@opsautomate.com', 'Demo@123');
      onNotify('Demo Account', 'Switched to Apex Wholesale & Retail demonstration workspace.', 'info');
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to login as demo user.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl max-w-md w-full border border-slate-200 shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-sky-100 text-sky-700 flex items-center justify-center">
              <Store className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-800">
                {isAuthenticated ? 'Business Account & Sessions' : (mode === 'login' ? 'Business Login' : 'Register New Business')}
              </h3>
              <p className="text-[11px] text-slate-500">Multi-tenant isolated workspace</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-200/60">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6">
          {isAuthenticated ? (
            <div className="space-y-4">
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                <div className="flex items-center gap-2 text-xs font-semibold text-slate-800">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>Currently Signed In:</span>
                </div>
                <p className="text-sm font-bold text-slate-900 mt-1">{user?.business_name || user?.businessName}</p>
                <p className="text-xs text-slate-500">{user?.email}</p>
              </div>

              <div className="flex flex-col gap-2 pt-2">
                <button
                  onClick={() => {
                    logout();
                    onNotify('Logged Out', 'You have been signed out. Public login required.', 'info');
                    onClose();
                  }}
                  className="w-full py-2 px-3 rounded-lg border border-rose-200 text-rose-700 hover:bg-rose-50 text-xs font-semibold transition"
                >
                  Log Out
                </button>
                <button
                  onClick={handleDemoLogin}
                  className="w-full py-2 px-3 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition"
                >
                  Switch to Standard Demo Account
                </button>
              </div>
            </div>
          ) : (
            <>
              {/* Mode Toggle */}
              <div className="flex rounded-lg bg-slate-100 p-1 mb-4 text-xs font-medium">
                <button
                  type="button"
                  onClick={() => { setMode('login'); setError(''); }}
                  className={`flex-1 py-1.5 rounded-md transition ${mode === 'login' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500'}`}
                >
                  Sign In
                </button>
                <button
                  type="button"
                  onClick={() => { setMode('register'); setError(''); }}
                  className={`flex-1 py-1.5 rounded-md transition ${mode === 'register' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500'}`}
                >
                  Register Store
                </button>
              </div>

              {error && (
                <div className="mb-4 text-xs p-2.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-800">
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-3">
                {mode === 'register' && (
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Business / Store Name</label>
                    <div className="relative">
                      <Store className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                      <input
                        type="text"
                        required
                        value={businessName}
                        onChange={(e) => setBusinessName(e.target.value)}
                        placeholder="e.g. Goyal Kirana & Provisions"
                        className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500"
                      />
                    </div>
                  </div>
                )}

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Email Address</label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="owner@mybusiness.com"
                      className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Password</label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                    <input
                      type="password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-2.5 mt-2 rounded-lg bg-sky-600 hover:bg-sky-700 text-white font-semibold text-xs shadow-xs transition disabled:opacity-50"
                >
                  {loading ? 'Processing...' : (mode === 'login' ? 'Sign In to Workspace' : 'Create Isolated Account')}
                </button>
              </form>

              <div className="relative my-4">
                <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-slate-200"></div></div>
                <div className="relative flex justify-center text-[10px] uppercase font-bold text-slate-400 bg-white px-2">
                  <span>Fast Track for Evaluators</span>
                </div>
              </div>

              <button
                type="button"
                onClick={handleDemoLogin}
                className="w-full py-2 px-3 rounded-lg border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-semibold transition flex items-center justify-center gap-1.5"
              >
                <LogIn className="w-3.5 h-3.5 text-sky-600" />
                <span>One-Click Login as Demo Owner</span>
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
