import React, { createContext, useContext, useState, useEffect } from 'react';
import { api, authStorage } from '../api/client';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(authStorage.getUser());
  const [token, setToken] = useState(authStorage.getToken());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // If no session exists, attempt auto-login as demo user for frictionless evaluation
    async function initSession() {
      if (token) {
        try {
          const res = await api.auth.me();
          setUser(res.user);
        } catch {
          authStorage.clear();
          setUser(null);
          setToken(null);
        }
      } else {
        // Auto-login as demo account
        try {
          const res = await api.auth.login('demo@opsautomate.com', 'Demo@123');
          authStorage.setToken(res.token);
          authStorage.setUser(res.user);
          setToken(res.token);
          setUser(res.user);
        } catch (e) {
          console.warn('Auto demo login skipped:', e.message);
        }
      }
      setLoading(false);
    }
    initSession();
  }, []);

  const login = async (email, password) => {
    const res = await api.auth.login(email, password);
    authStorage.setToken(res.token);
    authStorage.setUser(res.user);
    setToken(res.token);
    setUser(res.user);
    return res;
  };

  const register = async (businessName, email, password) => {
    const res = await api.auth.register(businessName, email, password);
    authStorage.setToken(res.token);
    authStorage.setUser(res.user);
    setToken(res.token);
    setUser(res.user);
    return res;
  };

  const logout = () => {
    authStorage.clear();
    setUser(null);
    setToken(null);
  };

  return (
    <AuthContext.Provider value={{ user, token, isAuthenticated: !!token, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
}
