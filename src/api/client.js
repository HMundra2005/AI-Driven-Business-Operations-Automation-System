/**
 * Unified API Client for AI-Driven Business Operations Automation System
 */

const TOKEN_KEY = 'opsautomate_auth_token';
const USER_KEY = 'opsautomate_auth_user';

export const authStorage = {
  getToken() {
    return localStorage.getItem(TOKEN_KEY);
  },
  setToken(token) {
    if (token) localStorage.setItem(TOKEN_KEY, token);
    else localStorage.removeItem(TOKEN_KEY);
  },
  getUser() {
    try {
      const u = localStorage.getItem(USER_KEY);
      return u ? JSON.parse(u) : null;
    } catch {
      return null;
    }
  },
  setUser(user) {
    if (user) localStorage.setItem(USER_KEY, JSON.stringify(user));
    else localStorage.removeItem(USER_KEY);
  },
  clear() {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  }
};

async function request(endpoint, options = {}) {
  const token = authStorage.getToken();
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  };

  const response = await fetch(endpoint, {
    ...options,
    headers,
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const errorMsg = data.error || `Request failed with status ${response.status}`;
    const err = new Error(errorMsg);
    err.status = response.status;
    err.data = data;
    throw err;
  }
  return data;
}

export const api = {
  // Auth
  auth: {
    login: (email, password) => request('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),
    register: (businessName, email, password) => request('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({ businessName, email, password }),
    }),
    me: () => request('/api/auth/me'),
    resetDemo: () => request('/api/auth/reset-demo', { method: 'POST' }),
  },

  // Dashboard
  dashboard: {
    getSummary: () => request('/api/dashboard/summary'),
    getWidgets: () => request('/api/dashboard/widgets'),
    getLayout: () => request('/api/dashboard/layout'),
    saveLayout: (layout) => request('/api/dashboard/layout', {
      method: 'POST',
      body: JSON.stringify({ layout }),
    }),
  },

  // Inventory
  inventory: {
    getProducts: () => request('/api/inventory/products'),
    addProduct: (productData) => request('/api/inventory/products', {
      method: 'POST',
      body: JSON.stringify(productData),
    }),
    updateStock: (productId, newStock, adjustment) => request(`/api/inventory/products/${productId}/stock`, {
      method: 'PUT',
      body: JSON.stringify({ newStock, adjustment }),
    }),
    getShortages: () => request('/api/inventory/shortages'),
    replenish: (productId, reorderQuantity) => request('/api/inventory/replenish', {
      method: 'POST',
      body: JSON.stringify({ productId, reorderQuantity }),
    }),
  },

  // Orders
  orders: {
    getOrders: () => request('/api/orders'),
    createOrder: (orderData) => request('/api/orders', {
      method: 'POST',
      body: JSON.stringify(orderData),
    }),
    updateStatus: (orderId, status) => request(`/api/orders/${orderId}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status }),
    }),
  },

  // Communications
  communications: {
    getEmails: () => request('/api/communications'),
    simulate: (emailData) => request('/api/communications/simulate', {
      method: 'POST',
      body: JSON.stringify(emailData),
    }),
    triggerProcessing: () => request('/api/communications/process', { method: 'POST' }),
    markRead: (emailId) => request(`/api/communications/${emailId}/read`, { method: 'PUT' }),
    approveReply: (emailId, customizedReply) => request(`/api/communications/${emailId}/reply`, {
      method: 'POST',
      body: JSON.stringify({ customizedReply }),
    }),
    getSummary: () => request('/api/communications/summary'),
  },

  // Tasks
  tasks: {
    getTasks: () => request('/api/tasks'),
    createTask: (taskData) => request('/api/tasks', {
      method: 'POST',
      body: JSON.stringify(taskData),
    }),
    toggleTask: (taskId) => request(`/api/tasks/${taskId}/toggle`, { method: 'PUT' }),
    deleteTask: (taskId) => request(`/api/tasks/${taskId}`, { method: 'DELETE' }),
  },

  // Approvals
  approvals: {
    getApprovals: (status) => request(`/api/approvals${status ? `?status=${status}` : ''}`),
    approve: (approvalId) => request(`/api/approvals/${approvalId}/approve`, { method: 'POST' }),
    reject: (approvalId, reason) => request(`/api/approvals/${approvalId}/reject`, {
      method: 'POST',
      body: JSON.stringify({ reason }),
    }),
  },

  // AI Assistant & Tool Execution
  ai: {
    chat: (message, history) => request('/api/ai/chat', {
      method: 'POST',
      body: JSON.stringify({ message, history }),
    }),
    getTools: () => request('/api/ai/tools'),
  },
};
